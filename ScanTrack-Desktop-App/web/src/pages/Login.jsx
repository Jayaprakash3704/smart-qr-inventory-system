import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const { loginWithGoogle, loginWithEmail, authError, setAuthError, currentUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [localError, setLocalError] = useState('');
  const [loading, setLoading] = useState(false);

  // Only navigate AFTER the backend has successfully fetched the role
  React.useEffect(() => {
    if (currentUser) {
      navigate('/dashboard', { replace: true });
    }
  }, [currentUser, navigate]);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      setLocalError('');
      if (setAuthError) setAuthError('');
      setLoading(true);
      await loginWithEmail(email, password);
      // Wait for onAuthStateChanged to trigger navigation
    } catch (err) {
      setLocalError('Failed to sign in. Check your credentials.');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setLocalError('');
      if (setAuthError) setAuthError('');
      setLoading(true);
      await loginWithGoogle();
      // Wait for onAuthStateChanged to trigger navigation
    } catch (err) {
      setLocalError('Failed to sign in with Google.');
      setLoading(false);
    }
  };

  const displayError = authError || localError;

  return (
    <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--gray-50)' }}>
      <div className="card card-p" style={{ maxWidth: 400, width: '100%', textAlign: 'center' }}>
        <h2 style={{ marginBottom: 8 }}>ScanTrack</h2>
        <p style={{ color: 'var(--gray-500)', marginBottom: 24 }}>Sign in to your account</p>
        
        {displayError && (
          <div style={{ color: 'var(--danger-text)', background: 'var(--danger-bg)', padding: '12px', borderRadius: 'var(--r-md)', marginBottom: 16, fontSize: 14, fontWeight: 500 }}>
            {displayError}
          </div>
        )}
        
        <form onSubmit={handleEmailLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <input 
            type="email" 
            placeholder="Email Address" 
            className="input" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
          <input 
            type="password" 
            placeholder="Password" 
            className="input" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
          <button type="submit" className="btn btn-primary" disabled={loading} style={{ justifyContent: 'center' }}>
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={{ margin: '20px 0', borderBottom: '1px solid var(--gray-200)', position: 'relative' }}>
          <span style={{ position: 'absolute', top: -10, left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 10px', color: 'var(--gray-400)', fontSize: 12 }}>OR</span>
        </div>

        <button 
          onClick={handleGoogleLogin} 
          className="btn btn-secondary" 
          disabled={loading} 
          style={{ width: '100%', justifyContent: 'center' }}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
