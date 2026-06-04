import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Droplet, ArrowRight, Lock, Mail, User } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        }
      }
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Supabase by default requires email confirmation, but if disabled it logs them in
      if (data.session) {
        navigate('/app');
      } else {
        setMessage('Registration successful! Please check your email to confirm your account.');
        setLoading(false);
      }
    }
  };

  return (
    <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="glass-panel animate-fade-in" style={{ padding: '3rem', width: '100%', maxWidth: '400px' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
            <Droplet color="var(--accent-primary)" size={48} />
          </div>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Create Account</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Join ChromaML today</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--error)', color: 'var(--error)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {error}
          </div>
        )}
        
        {message && (
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', color: 'var(--success)', padding: '0.75rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem', textAlign: 'center' }}>
            {message}
          </div>
        )}

        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Full Name</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="text" 
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. Jane Doe"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
            <div style={{ position: 'relative' }}>
              <Mail size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: 'var(--text-secondary)' }} />
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="scientist@lab.com"
                style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.5rem', borderRadius: '8px', border: '1px solid var(--glass-border)', background: 'rgba(0,0,0,0.2)', color: 'white', outline: 'none' }}
              />
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Password</label>
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

          <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: '100%', padding: '0.75rem', marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
            {loading ? 'Creating Account...' : 'Sign Up'} <ArrowRight size={18} />
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
          Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Sign In</Link>
        </div>
      </div>
    </div>
  );
}
