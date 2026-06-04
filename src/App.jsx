import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Droplet } from 'lucide-react';
import { supabase } from './supabaseClient';
import { App as CapacitorApp } from '@capacitor/app';
import './index.css';

import Landing from './Landing';
import Login from './Login';
import Register from './Register';
import ForgotPassword from './ForgotPassword';
import ResetPassword from './ResetPassword';
import ColorimeterTool from './ColorimeterTool';
import Reports from './Reports';

function Navigation({ session }) {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  return (
    <nav className="glass-panel main-nav" style={{ margin: '1rem auto', maxWidth: '1200px', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '100px' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700', fontSize: '1.25rem', textDecoration: 'none', color: 'inherit' }}>
        <Droplet color="var(--accent-primary)" />
        <span>Chroma<span className="text-gradient">ML</span></span>
      </Link>
      
      <div className="nav-buttons">
        {session ? (
          <>
            <Link to="/app" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>
              Dashboard
            </Link>
            <Link to="/reports" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none', border: '1px solid var(--accent-primary)' }}>
              My Reports
            </Link>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.5rem 1rem', borderRadius: '50px' }}
              onClick={handleSignOut}
            >
              Sign Out
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>
              Sign In
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.5rem 1rem', borderRadius: '50px', textDecoration: 'none' }}>
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}

const ProtectedRoute = ({ session, children }) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function BackButtonListener() {
  const navigate = useNavigate();
  useEffect(() => {
    const listener = CapacitorApp.addListener('backButton', ({ canGoBack }) => {
      if (window.location.pathname === '/' || window.location.pathname === '/app') {
        CapacitorApp.exitApp();
      } else if (canGoBack) {
        window.history.back();
      } else {
        CapacitorApp.exitApp();
      }
    });
    return () => {
      listener.then(l => l.remove());
    };
  }, []);
  return null;
}

function AuthHandler({ setSession }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [setSession]);

  return null;
}

function AppLayout({ session }) {
  const location = useLocation();
  const hideNav = location.pathname === '/reset-password';

  return (
    <>
      {!hideNav && <Navigation session={session} />}
    </>
  );
}

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRecovery, setIsRecovery] = useState(false);

  useEffect(() => {
    // Check hash BEFORE Supabase clears it
    if (window.location.hash.includes('type=recovery')) {
      setIsRecovery(true);
    }
    
    supabase.auth.getSession().then(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner"></div></div>;
  }

  return (
    <Router>
      <AuthHandler setSession={setSession} />
      <BackButtonListener />
      <div className="bg-gradient-blob"></div>
      <div className="bg-gradient-blob-2"></div>
      
      <AppLayout session={session} />

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={!session ? <Login /> : (isRecovery ? <Navigate to="/reset-password" /> : <Navigate to="/app" />)} />
          <Route path="/register" element={!session ? <Register /> : (isRecovery ? <Navigate to="/reset-password" /> : <Navigate to="/app" />)} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/app" 
            element={
              <ProtectedRoute session={session}>
                {isRecovery ? <Navigate to="/reset-password" /> : <ColorimeterTool session={session} />}
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute session={session}>
                <Reports session={session} />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
