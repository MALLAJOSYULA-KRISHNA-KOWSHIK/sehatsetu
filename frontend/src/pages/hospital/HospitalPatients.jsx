import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, AlertCircle, Users, Upload, CheckCircle2, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HospitalPatients = () => {
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  // Upload modal state
  const [uploadModal, setUploadModal] = useState({ show: false, patientId: '', patientName: '' });
  const [formData, setFormData] = useState({ title: '', record_type: 'Lab Report', record_date: '', notes: '', doctor_id: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const [patRes, docRes] = await Promise.all([
          api.get('/hospital/patients'),
          api.get(`/facilities/${user.managed_facility_id}/doctors`)
        ]);
        setPatients(patRes.data);
        setDoctors(docRes.data);
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) { setError('Please select a file'); return; }
    setUploading(true); setError(''); setSuccess('');

    const data = new FormData();
    data.append('patient_id', uploadModal.patientId);
    data.append('doctor_id', formData.doctor_id);
    data.append('title', formData.title);
    data.append('record_type', formData.record_type);
    data.append('record_date', formData.record_date);
    data.append('notes', formData.notes);
    data.append('file', selectedFile);

    try {
      await api.post('/hospital/health-records', data, { headers: { 'Content-Type': 'multipart/form-data' } });
      setSuccess(`Record uploaded for ${uploadModal.patientName}`);
      setUploadModal({ show: false, patientId: '', patientName: '' });
      setFormData({ title: '', record_type: 'Lab Report', record_date: '', notes: '', doctor_id: '' });
      setSelectedFile(null);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="h-full flex justify-center items-center"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Patients</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}
      
      {patients.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No patients found. Patients will appear here after their first confirmed appointment.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Patient Details</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Last Visit</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {patients.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 transition">
                  <td className="p-4">
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-xs text-slate-500">{p.phone} • {p.gender}</p>
                  </td>
                  <td className="p-4">
                    <span className="text-sm text-slate-700">{p.last_visit}</span>
                  </td>
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => {
                        setUploadModal({ show: true, patientId: p.id, patientName: p.name });
                        setFormData(prev => ({
                          ...prev, 
                          doctor_id: p.last_doctor_id || '',
                          record_date: p.last_visit || ''
                        }));
                      }}
                      className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition inline-flex items-center gap-2"
                    >
                      <Upload className="h-4 w-4" /> Upload Record
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Upload Record for {uploadModal.patientName}</h3>
              <button onClick={() => setUploadModal({ show: false, patientId: '', patientName: '' })}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor *</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" value={formData.doctor_id} onChange={e => setFormData({...formData, doctor_id: e.target.value})} required>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" value={formData.record_type} onChange={e => setFormData({...formData, record_type: e.target.value})}>
                    <option value="Lab Report">Lab Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Date *</label><input type="date" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" value={formData.record_date} onChange={e => setFormData({...formData, record_date: e.target.value})} required /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">Notes</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} /></div>
              <div><label className="block text-sm font-medium text-slate-700 mb-1">File (PDF/JPG/PNG, max 10MB) *</label><input type="file" accept=".pdf,.jpg,.jpeg,.png" className="w-full" onChange={e => setSelectedFile(e.target.files[0])} required /></div>
              
              <button type="submit" disabled={uploading} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? 'Uploading...' : 'Upload Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HospitalPatients;
