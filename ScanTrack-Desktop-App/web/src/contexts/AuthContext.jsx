import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithPopup, googleProvider, signInWithEmailAndPassword, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Get Firebase token
        const token = await user.getIdToken();
        // Set Axios default header
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Fetch role from our backend
        try {
          const res = await axios.get('/api/users/me');
          setCurrentUser({ ...user, role: res.data.role });
        } catch (err) {
          console.error("Failed to fetch user role from backend:", err);
          setCurrentUser(null);
          axios.defaults.headers.common['Authorization'] = null;
          await signOut(auth); // Force signout if they don't exist in our DB
        }
      } else {
        setCurrentUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
  const loginWithEmail = (email, password) => signInWithEmailAndPassword(auth, email, password);
  const logout = () => signOut(auth);

  const value = {
    currentUser,
    loginWithGoogle,
    loginWithEmail,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
