import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, signInWithPopup, googleProvider, signInWithEmailAndPassword, signOut } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setAuthError('');
        const token = await user.getIdToken();
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        try {
          const res = await axios.get('/api/users/me');
          setCurrentUser({ ...user, role: res.data.role });
        } catch (err) {
          console.error("Auth Error:", err);
          setCurrentUser(null);
          axios.defaults.headers.common['Authorization'] = null;
          await signOut(auth);
          setAuthError('Access Denied: You are not registered in the system.');
        }
      } else {
        setCurrentUser(null);
        delete axios.defaults.headers.common['Authorization'];
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithGoogle = () => {
    setAuthError('');
    return signInWithPopup(auth, googleProvider);
  };
  
  const loginWithEmail = (email, password) => {
    setAuthError('');
    return signInWithEmailAndPassword(auth, email, password);
  };
  
  const logout = () => signOut(auth);

  const value = {
    currentUser,
    loginWithGoogle,
    loginWithEmail,
    logout,
    authError,
    setAuthError
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
