import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import db from './db.js';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.FIREBASE_PROJECT_ID) {
  console.error("Missing FIREBASE_PROJECT_ID in environment variables");
  process.exit(1);
}

initializeApp({
  projectId: process.env.FIREBASE_PROJECT_ID,
});

export const auth = getAuth();

// Middleware to verify Firebase Token
export const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split('Bearer ')[1];
  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = decodedToken; // contains uid, email, etc.
    
    // Lookup role in SQLite
    const stmt = db.prepare('SELECT role, uid FROM users WHERE uid = ?');
    let userRow = stmt.get(req.user.uid);
    
    if (!userRow && req.user.email) {
      // Fallback: Check if they exist by email (Google Sign-In might generate a different UID)
      const emailStmt = db.prepare('SELECT role, uid FROM users WHERE email = ?');
      userRow = emailStmt.get(req.user.email);
      
      if (userRow) {
        // Update their UID in SQLite to match the new Firebase Google UID
        db.prepare('UPDATE users SET uid = ? WHERE email = ?').run(req.user.uid, req.user.email);
      }
    }
    
    if (userRow) {
      req.user.role = userRow.role;
    } else {
      // If user isn't in SQLite, they don't have access to this system yet.
      return res.status(403).json({ error: 'Forbidden: User not registered in system' });
    }
    
    next();
  } catch (error) {
    console.error("Auth verification failed:", error);
    return res.status(401).json({ error: 'Unauthorized: Token verification failed' });
  }
};

export const requireRole = (role) => {
  return (req, res, next) => {
    if (role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    if (role === 'staff' && req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Forbidden: Staff access required' });
    }
    next();
  };
};
