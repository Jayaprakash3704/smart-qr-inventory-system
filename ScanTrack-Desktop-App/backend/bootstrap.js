import db from './db.js';
import { auth } from './auth.js';

export const bootstrapAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.log("No ADMIN_EMAIL or ADMIN_PASSWORD set in .env. Skipping bootstrap.");
    return;
  }

  try {
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(adminEmail);
      console.log(`Admin user with email ${adminEmail} already exists in Firebase.`);
    } catch (e) {
      if (e.code === 'auth/user-not-found') {
        userRecord = await auth.createUser({
          email: adminEmail,
          password: adminPassword,
          displayName: 'System Admin',
        });
        console.log(`Created new Admin user with email ${adminEmail} in Firebase.`);
      } else if (e.code?.startsWith('app/')) {
        console.warn(`[Bootstrap Warning] Could not connect to Firebase Admin to create/verify admin user (Check GOOGLE_APPLICATION_CREDENTIALS): ${e.message}`);
        return; // Stop bootstrap, wait for user to fix credentials
      } else {
        throw e;
      }
    }

    // Ensure the user has the admin role in the SQLite database
    const stmt = db.prepare('SELECT * FROM users WHERE uid = ?');
    const existingRole = stmt.get(userRecord.uid);
    if (!existingRole) {
      const insert = db.prepare('INSERT INTO users (uid, email, role) VALUES (?, ?, ?)');
      insert.run(userRecord.uid, userRecord.email, 'admin');
      console.log(`Added admin role for ${adminEmail} into local SQLite database.`);
    }
  } catch (error) {
    console.error("Error during admin bootstrap:", error);
  }
};
