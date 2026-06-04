import React, { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { Activity, Clock, CheckCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export default function Reports({ session }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReports(data || []);
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (report) => {
    const reportElement = document.getElementById(`report-${report.id}`);
    if (!reportElement) return;
    
    // Temporarily adjust styling for PDF snapshot
    reportElement.style.background = '#1a1a2e'; // Solid background for PDF
    
    try {
      const canvas = await html2canvas(reportElement, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      
      const fileName = `Titration_Report_${report.video_name.replace('.mp4', '')}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const base64Data = pdf.output('datauristring').split(',')[1];
        
        const savedFile = await Filesystem.writeFile({
          path: fileName,
          data: base64Data,
          directory: Directory.Cache
        });
        
        await Share.share({
          title: fileName,
          url: savedFile.uri,
          dialogTitle: 'Share or Save PDF Report'
        });
      } else {
        pdf.save(fileName);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      reportElement.style.background = ''; // Revert style
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto', border: '3px solid var(--glass-border)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Loading your reports...</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>My Reports</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Historical titration analysis results.</p>
        </div>
      </div>

      {reports.length === 0 ? (
        <div className="glass-panel" style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Activity size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <p>No reports found. Run an analysis in the dashboard to save your first report!</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {reports.map((report) => (
            <div key={report.id} id={`report-${report.id}`} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', wordBreak: 'break-all' }}>
                    <CheckCircle size={20} color={report.endpoint_time ? 'var(--success)' : 'var(--error)'} style={{ flexShrink: 0 }} /> 
                    {report.video_name}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Clock size={14} /> {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDownloadPDF(report)}
                  className="btn btn-secondary"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                >
                  <Download size={16} /> Download PDF
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Endpoint Time</p>
                  <p style={{ fontSize: '1.5rem', fontWeight: '700', margin: 0, color: 'var(--text-primary)' }}>{report.endpoint_time || 'N/A'}</p>
                </div>
                
                <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '8px' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>Confidence</p>
                  <p style={{ fontSize: '1.25rem', fontWeight: '700', margin: 0, color: 'var(--accent-primary)' }}>{report.confidence_score}%</p>
                </div>
              </div>
              
              <p style={{ fontSize: '0.9rem', color: 'var(--accent-secondary)' }}>
                Method: {report.analysis_method}
              </p>
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)', borderRadius: '12px', padding: '1rem', width: '100%', overflow: 'hidden' }}>
                {report.chart_image_b64 ? (
                  <img src={report.chart_image_b64} alt="Report Chart" style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }} />
                ) : (
                  <p style={{ color: 'var(--text-secondary)' }}>No graph available</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
