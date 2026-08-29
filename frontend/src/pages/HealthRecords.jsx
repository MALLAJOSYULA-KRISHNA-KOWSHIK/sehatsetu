import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { FileText, Upload, Trash2, Plus, X, Loader2, AlertCircle, CheckCircle2, File } from 'lucide-react';

const HealthRecords = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ title: '', record_type: 'Prescription', record_date: '', notes: '' });
  const [selectedFile, setSelectedFile] = useState(null);

  const fetchRecords = async () => {
    try { const res = await api.get('/health-records/'); setRecords(res.data); } catch { setError('Failed to load records'); }
  };

  useEffect(() => { fetchRecords().finally(() => setLoading(false)); }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setError('Please select a file'); return; }
    setSubmitting(true); setError(''); setSuccess('');
    const data = new FormData();
    data.append('title', formData.title);
    data.append('record_type', formData.record_type);
    data.append('record_date', formData.record_date);
    data.append('notes', formData.notes);
    data.append('file', selectedFile);
    try {
      await api.post('/health-records/', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess('Record uploaded!'); setShowForm(false);
      setFormData({ title: '', record_type: 'Prescription', record_date: '', notes: '' });
      setSelectedFile(null); await fetchRecords();
    } catch (err) { setError(err.response?.data?.detail || 'Upload failed'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this record?')) return;
    try { await api.delete(`/health-records/${id}`); await fetchRecords(); } catch { setError('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full p-12"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 md:p-8 pt-8 max-w-4xl mx-auto mt-2 md:mt-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight">{t('health_records.title')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-black text-white px-5 py-2.5 rounded-[30px] font-medium text-[13px] hover:bg-slate-800 transition flex items-center gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? t('appointments.cancel') : t('health_records.upload_btn')}
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}

      {showForm && (
        <form onSubmit={handleUpload} className="bg-white p-6 rounded-2xl border border-slate-200 mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-[13px] font-medium text-slate-700 mb-1">Title *</label><input type="text" className="w-full px-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} required /></div>
            <div><label className="block text-[13px] font-medium text-slate-700 mb-1">Type</label><select className="w-full px-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition" value={formData.record_type} onChange={(e) => setFormData({...formData, record_type: e.target.value})}><option value="Prescription">{t('health_records.type_prescription')}</option><option value="Lab Report">{t('health_records.type_lab_report')}</option><option value="Scan">{t('health_records.type_scan')}</option><option value="Other">Other</option></select></div>
          </div>
          <div><label className="block text-[13px] font-medium text-slate-700 mb-1">Date *</label><input type="date" className="w-full px-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition" value={formData.record_date} onChange={(e) => setFormData({...formData, record_date: e.target.value})} required /></div>
          <div><label className="block text-[13px] font-medium text-slate-700 mb-1">Notes</label><input type="text" className="w-full px-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition" value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} /></div>
          <div><label className="block text-[13px] font-medium text-slate-700 mb-1">File (PDF/JPG/PNG, max 10MB) *</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full text-[13px] file:mr-4 file:py-2 file:px-4 file:rounded-[30px] file:border-0 file:text-[13px] file:font-semibold file:bg-slate-50 file:text-slate-700 hover:file:bg-slate-100" onChange={(e) => setSelectedFile(e.target.files[0])} required /></div>
          <button type="submit" disabled={submitting} className="mt-2 bg-black text-white font-medium text-[13px] py-2.5 px-6 rounded-[30px] hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {submitting ? t('common.loading') : t('health_records.upload_btn')}
          </button>
        </form>
      )}

      {records.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center"><FileText className="h-12 w-12 text-slate-300 mx-auto mb-3" /><p className="text-slate-500 text-[13px]">{t('health_records.no_records')}</p></div>
      ) : (
        <div className="space-y-0 border border-slate-200 rounded-2xl bg-white overflow-hidden">
          {records.map((r, idx) => {
            const fileUrl = `http://${window.location.hostname}:8000/${r.file_path?.replace(/\\/g, '/')}`;
            return (
              <div key={r.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition ${idx !== 0 ? 'border-t border-slate-200' : ''}`}>
                <button 
                  onClick={async (e) => {
                    e.preventDefault();
                    try {
                      const response = await fetch(fileUrl);
                      if (!response.ok) throw new Error("Network response was not ok");
                      const blob = await response.blob();
                      const blobUrl = URL.createObjectURL(blob);
                      window.open(blobUrl, '_blank');
                    } catch (err) {
                      console.error("Failed to load file offline", err);
                      alert("Unable to open file. You might be offline and this file hasn't been cached yet.");
                    }
                  }} 
                  className="flex items-center gap-4 flex-1 text-left group"
                >
                  <div className="bg-slate-100 p-3 rounded-[12px]"><File className="h-5 w-5 text-slate-600 group-hover:text-slate-900 transition" /></div>
                  <div>
                    <p className="font-semibold text-slate-900 text-[14px] group-hover:underline transition">{r.title}</p>
                    <p className="text-[12px] text-slate-500 mt-0.5">{r.date} • {r.record_type}</p>
                  </div>
                </button>
                <button onClick={() => handleDelete(r.id)} className="text-slate-400 hover:text-red-600 p-2 border border-transparent hover:border-red-200 hover:bg-red-50 rounded-full transition self-end sm:self-auto"><Trash2 className="h-4 w-4" /></button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HealthRecords;
