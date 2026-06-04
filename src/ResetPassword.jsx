import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, ArrowRight, Lock } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if the user reached here via a recovery link (hash fragment in URL)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event == "PASSWORD_RECOVERY") {
        // Ready to reset password
      }
    });
  }, []);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return;
    }
    
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      navigate('/login');
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Droplet color="var(--accent-primary)" size={48} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create New Password</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Enter your new secure password below</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleUpdatePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>New Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Confirm Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="password" 
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? 'Updating...' : 'Update Password'} <ArrowRight size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
