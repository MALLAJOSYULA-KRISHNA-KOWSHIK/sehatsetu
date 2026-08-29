import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, AlertCircle, CheckCircle2, Clock, Check, X, Download, Upload } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const HospitalAppointments = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [declineModal, setDeclineModal] = useState({ show: false, id: '', reason: '' });
  
  // Upload modal state
  const [uploadModal, setUploadModal] = useState({ show: false, patientId: '', patientName: '', doctorId: '' });
  const [formData, setFormData] = useState({ title: '', record_type: 'Lab Report', record_date: '', notes: '', doctor_id: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchAppointments = async () => {
    try {
      const [apptRes, docRes] = await Promise.all([
        api.get('/hospital/appointments'),
        api.get(`/facilities/${user.managed_facility_id}/doctors`)
      ]);
      setAppointments(apptRes.data);
      setDoctors(docRes.data);
    } catch (err) {
      setError('Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleAccept = async (id) => {
    try {
      await api.put(`/appointments/${id}/accept`);
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to accept');
    }
  };

  const handleComplete = async (id) => {
    try {
      await api.put(`/appointments/${id}/complete`);
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to complete');
    }
  };

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

  const handleDecline = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/appointments/${declineModal.id}/decline`, { decline_reason: declineModal.reason });
      setDeclineModal({ show: false, id: '', reason: '' });
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to decline');
    }
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    CONFIRMED: 'bg-green-100 text-green-800 border-green-200',
    CANCELLED: 'bg-slate-100 text-slate-600 border-slate-200',
    COMPLETED: 'bg-blue-100 text-blue-800 border-blue-200',
    REJECTED: 'bg-red-100 text-red-800 border-red-200',
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    doc.text('Hospital Appointments', 14, 15);
    
    const tableColumn = ["Patient", "Phone", "Doctor", "Specialization", "Date", "Time", "Status"];
    const tableRows = [];

    appointments.forEach(appt => {
      const rowData = [
        appt.patient_name,
        appt.patient_phone,
        appt.doctor_name,
        appt.specialization,
        appt.preferred_date,
        appt.preferred_time,
        appt.status
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] } // green-600
    });
    
    doc.save(`appointments_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  if (loading) return <div className="h-full flex justify-center items-center"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Appointments</h1>
        <button 
          onClick={handleDownloadPDF} 
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
        >
          <Download className="h-4 w-4" /> Download PDF
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="p-4 text-sm font-semibold text-slate-600">Patient</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Doctor & Specialization</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Date & Time</th>
                <th className="p-4 text-sm font-semibold text-slate-600">Status</th>
                <th className="p-4 text-sm font-semibold text-slate-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {appointments.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500">No appointments found.</td></tr>
              ) : (
                appointments.map(appt => (
                  <tr key={appt.id} className="hover:bg-slate-50 transition">
                    <td className="p-4">
                      <p className="font-bold text-slate-900">{appt.patient_name}</p>
                      <p className="text-xs text-slate-500">{appt.patient_phone}</p>
                      {appt.is_escalated && (
                        <span className={`mt-1 inline-block text-[10px] font-bold px-2 py-0.5 rounded shadow-sm ${appt.urgency_level === 'HIGH' ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}>
                          AI ESCALATED - {appt.urgency_level || 'MEDIUM'}
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-slate-800">{appt.doctor_name}</p>
                      <p className="text-xs text-green-600 font-medium">{appt.specialization}</p>
                    </td>
                    <td className="p-4">
                      <p className="text-sm font-medium flex items-center gap-1 text-slate-700"><Clock className="h-3.5 w-3.5" /> {appt.preferred_date}</p>
                      <p className="text-xs text-slate-500">{appt.preferred_time}</p>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${statusColors[appt.status]}`}>
                        {appt.status}
                      </span>
                      {appt.status === 'REJECTED' && appt.decline_reason && (
                        <p className="text-[10px] text-red-500 mt-1 max-w-[150px] truncate" title={appt.decline_reason}>Reason: {appt.decline_reason}</p>
                      )}
                    </td>
                    <td className="p-4 text-right">
                      {appt.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleAccept(appt.id)} className="bg-green-100 text-green-700 p-2 rounded-lg hover:bg-green-200 transition" title="Accept">
                            <Check className="h-4 w-4" />
                          </button>
                          <button onClick={() => setDeclineModal({ show: true, id: appt.id, reason: '' })} className="bg-red-100 text-red-700 p-2 rounded-lg hover:bg-red-200 transition" title="Decline">
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                      {appt.status === 'CONFIRMED' && (
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleComplete(appt.id)} className="bg-blue-100 text-blue-700 p-2 rounded-lg hover:bg-blue-200 transition flex items-center gap-1 text-xs font-bold" title="Mark as Completed">
                            <CheckCircle2 className="h-4 w-4" /> Complete
                          </button>
                        </div>
                      )}
                      {appt.status === 'COMPLETED' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => {
                              // We need the patient's actual user_id for patientId, but the endpoint only returns patient_name and phone.
                              // Wait, the backend currently only returns string patient_name, it doesn't return patient_id in /hospital/appointments!
                              // I must fix the backend to return patient_id in the payload.
                              setUploadModal({ show: true, patientId: appt.patient_id, patientName: appt.patient_name });
                              setFormData(prev => ({
                                ...prev, 
                                doctor_id: appt.doctor_id || '',
                                record_date: appt.preferred_date || ''
                              }));
                            }} 
                            className="bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-indigo-100 transition flex items-center gap-1"
                          >
                            <Upload className="h-3.5 w-3.5" /> Upload Record
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Decline Modal */}
      {declineModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Decline Appointment</h3>
            <form onSubmit={handleDecline}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason for declining *</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-red-500 outline-none" 
                  placeholder="e.g. Doctor is on leave" 
                  value={declineModal.reason} 
                  onChange={e => setDeclineModal({...declineModal, reason: e.target.value})} 
                  required 
                />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setDeclineModal({ show: false, id: '', reason: '' })} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700">Decline Appointment</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {uploadModal.show && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Upload Record for {uploadModal.patientName}</h3>
              <button onClick={() => setUploadModal({ show: false, patientId: '', patientName: '', doctorId: '' })}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Doctor *</label>
                <select className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.doctor_id} onChange={e => setFormData({...formData, doctor_id: e.target.value})} required>
                  <option value="">Select Doctor</option>
                  {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.specialization})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Type *</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.record_type} onChange={e => setFormData({...formData, record_type: e.target.value})}>
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
              
              <button type="submit" disabled={uploading} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} {uploading ? 'Uploading...' : 'Upload Record'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalAppointments;
