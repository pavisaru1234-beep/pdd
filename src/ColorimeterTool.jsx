import React, { useState, useRef } from 'react';
import { Upload, Activity } from 'lucide-react';
import { supabase } from './supabaseClient';

export default function ColorimeterTool({ session }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [rawFile, setRawFile] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setRawFile(file);
      const url = URL.createObjectURL(file);
      setSelectedFile(url);
      setFileType(file.type.startsWith('video/') ? 'video' : 'image');
      setResult(null);
    }
  };

  const analyzeMedia = async () => {
    if (!rawFile) return;
    
    setIsAnalyzing(true);
    setResult(null);
    
    const formData = new FormData();
    formData.append('file', rawFile);

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
      const response = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      setIsAnalyzing(false);

      if (data.error) {
        alert("Error analyzing video: " + data.error);
        return;
      }

      setResult(data);
      
      // Save to Supabase
      if (session?.user) {
        try {
          const { error: dbError } = await supabase.from('reports').insert([
            {
              user_id: session.user.id,
              video_name: rawFile.name,
              endpoint_time: data.endpointTime || null,
              confidence_score: data.confidence || 0,
              analysis_method: data.colorShift || 'Unknown',
              chart_image_b64: data.chartBase64 || null
            }
          ]);
          if (dbError) {
             console.error("Failed to save report to Supabase", dbError);
             // don't alert the user necessarily, just log it, unless we want to show a toast
          }
        } catch (e) {
          console.error("Supabase insert exception", e);
        }
      }

    } catch (error) {
      console.error("Analysis failed", error);
      alert("Failed to connect to backend server. Make sure FastAPI is running on port 8000.");
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>Endpoint Detector (True CV)</h2>
        <p style={{ color: 'var(--text-secondary)' }}>Upload a video of your titration flask for computer vision analysis.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Upload size={20} className="text-gradient" /> Input Media
          </h3>
          
          <div style={{ 
            flex: 1, border: '2px dashed var(--glass-border)', borderRadius: '12px', 
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
            position: 'relative', overflow: 'hidden', minHeight: '350px', backgroundColor: 'rgba(0,0,0,0.2)'
          }}>
            {selectedFile ? (
              fileType === 'video' ? (
                <video ref={videoRef} src={selectedFile} controls style={{ width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' }} />
              ) : (
                <img src={selectedFile} alt="Titration sample" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              )
            ) : (
              <>
                <Upload size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
                <p style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Click or drag file here</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Please upload an MP4 or MOV video</p>
              </>
            )}
            {!selectedFile && (
              <input type="file" accept="video/*" onChange={handleFileUpload} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }} />
            )}
          </div>

          {selectedFile && (
            <button className="btn btn-secondary" style={{ marginTop: '1rem', fontSize: '0.9rem', padding: '0.5rem' }} onClick={() => { setSelectedFile(null); setRawFile(null); setResult(null); }}>
              Clear File
            </button>
          )}
          
          <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }} disabled={!selectedFile || isAnalyzing} onClick={analyzeMedia}>
            {isAnalyzing ? 'Extracting Frames & Analyzing...' : 'Run True OpenCV Analysis'}
          </button>
        </div>

        <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={20} className="text-gradient" /> Analysis Results
          </h3>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            {!selectedFile ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Awaiting media input...</div>
            ) : isAnalyzing ? (
              <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ 
                  width: '40px', height: '40px', border: '3px solid var(--glass-border)', 
                  borderTopColor: 'var(--accent-primary)', borderRadius: '50%', margin: '0 auto 1rem auto',
                  animation: 'spin 1s linear infinite' 
                }}></div>
                <p className="text-gradient" style={{ fontWeight: '600' }}>Processing Time-Series Data...</p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.5rem' }}>OpenCV is extracting features for AI validation...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            ) : result ? (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ 
                  padding: '1.5rem', borderRadius: '12px', textAlign: 'center',
                  background: result.endpointReached ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  border: `1px solid ${result.endpointReached ? 'var(--success)' : 'var(--error)'}`
                }}>
                  <h4 style={{ fontSize: '1.5rem', color: result.endpointReached ? 'var(--success)' : 'var(--error)', marginBottom: '0.5rem' }}>
                    {result.endpointReached ? 'Endpoint Detected' : 'Endpoint Not Reached / Invalid'}
                  </h4>
                  {result.endpointTime && (
                     <p style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: '600' }}>
                       Time: {result.endpointTime} (Frame #{result.frameNumber})
                     </p>
                  )}
                  <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Change-point algorithm analyzed color shift.</p>
                </div>

                {result.chartBase64 && (
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '0.5rem' }}>Real Color Variation Timeline</p>
                    <img src={result.chartBase64} alt="Timeline chart" style={{ width: '100%', borderRadius: '4px' }} />
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Confidence Score</p>
                    <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: 'var(--accent-primary)' }}>{result.confidence}%</p>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Analysis Method</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: '700', margin: 0, color: 'var(--accent-secondary)' }}>{result.colorShift}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>Ready for analysis</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
