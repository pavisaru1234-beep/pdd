import React from 'react';
import { ArrowRight, Video, BarChart2, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="animate-fade-in" style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>
        Precision Titration,<br />
        <span className="text-gradient">Powered by CV</span>
      </h1>
      <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', marginBottom: '3rem' }}>
        Eliminate subjectivity from chemical reaction end-point detection. 
        Upload videos of your titration, and our true computer vision backend will perform automated change-point analysis.
      </p>
      
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '5rem' }}>
        <button className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }} onClick={() => navigate('/app')}>
          Start Analysis <ArrowRight size={20} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        {[
          { icon: <Video color="var(--accent-primary)" size={32}/>, title: 'Real Video Processing', desc: 'Frames are extracted using OpenCV and processed natively in our Python backend.' },
          { icon: <BarChart2 color="var(--success)" size={32}/>, title: 'Mathematical Change-Point', desc: 'Converts color to HSV, smooths the signal, and calculates the exact gradient maxima.' },
          { icon: <CheckCircle color="var(--accent-secondary)" size={32}/>, title: 'Maximum Accuracy', desc: 'Provides objective and highly reproducible laboratory results via statistical analysis.' }
        ].map((feature, i) => (
          <div key={i} className="glass-panel" style={{ padding: '2rem' }}>
            <div style={{ marginBottom: '1rem' }}>{feature.icon}</div>
            <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-secondary)' }}>{feature.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
