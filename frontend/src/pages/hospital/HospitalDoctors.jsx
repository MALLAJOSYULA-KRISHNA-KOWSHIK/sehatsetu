import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, AlertCircle, Building2, Plus, Edit2, Trash2, X, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const HospitalDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    qualification: '',
    experience_years: '',
    languages: '',
    phone: '',
    consultation_fee: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchDoctors = async () => {
    try {
      const res = await api.get(`/facilities/${user.managed_facility_id}/doctors`);
      setDoctors(res.data);
    } catch (err) {
      setError('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, [user]);

  const handleOpenModal = (doc = null) => {
    setError('');
    setSuccess('');
    if (doc) {
      setEditingDoc(doc);
      setFormData({
        name: doc.name,
        specialization: doc.specialization,
        qualification: doc.qualification || '',
        experience_years: doc.experience_years || '',
        languages: doc.languages || '',
        phone: doc.phone || '',
        consultation_fee: doc.consultation_fee || ''
      });
    } else {
      setEditingDoc(null);
      setFormData({
        name: '', specialization: '', qualification: '', experience_years: '', languages: '', phone: '', consultation_fee: ''
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      // Clean empty strings to null or correct types for backend
      const payload = {
        name: formData.name,
        specialization: formData.specialization,
        qualification: formData.qualification || null,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        languages: formData.languages || null,
        phone: formData.phone || null,
        consultation_fee: formData.consultation_fee ? parseFloat(formData.consultation_fee) : null
      };

      if (editingDoc) {
        await api.put(`/hospital/doctors/${editingDoc.id}`, payload);
        setSuccess('Doctor updated successfully');
      } else {
        await api.post('/hospital/doctors', payload);
        setSuccess('Doctor added successfully');
      }
      setShowModal(false);
      await fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save doctor');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to remove ${name} from your facility?`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/hospital/doctors/${id}`);
      setSuccess('Doctor removed successfully');
      await fetchDoctors();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to delete doctor');
    }
  };

  if (loading) return <div className="h-full flex justify-center items-center"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-5xl mx-auto relative">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Our Doctors</h1>
        <button 
          onClick={() => handleOpenModal()} 
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Doctor
        </button>
      </div>

      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}
      
      {doctors.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
          <Building2 className="h-12 w-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No doctors registered yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {doctors.map(doc => (
            <div key={doc.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex items-center justify-between gap-4 group">
              <div className="flex items-center gap-4">
                <div className="bg-slate-50 h-14 w-14 rounded-full flex items-center justify-center font-bold text-slate-400 text-xl">
                  {doc.name.replace('Dr. ', '').charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{doc.name}</h3>
                  <p className="text-green-600 font-medium text-sm">{doc.specialization}</p>
                  <div className="flex gap-4 mt-2">
                    {doc.experience_years && <span className="text-xs text-slate-500">{doc.experience_years}y exp</span>}
                    {doc.consultation_fee && <span className="text-xs text-slate-500">₹{doc.consultation_fee} fee</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                <button onClick={() => handleOpenModal(doc)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"><Edit2 className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(doc.id, doc.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full my-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingDoc ? 'Edit Doctor' : 'Add New Doctor'}</h3>
              <button onClick={() => setShowModal(false)}><X className="h-5 w-5 text-slate-400" /></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name *</label>
                <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Dr. Rajesh Kumar" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Specialization *</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-green-500 outline-none" placeholder="e.g. Cardiologist" value={formData.specialization} onChange={e => setFormData({...formData, specialization: e.target.value})} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Qualifications</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" placeholder="e.g. MBBS, MD" value={formData.qualification} onChange={e => setFormData({...formData, qualification: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Experience (Years)</label>
                  <input type="number" min="0" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" value={formData.experience_years} onChange={e => setFormData({...formData, experience_years: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Consultation Fee (₹)</label>
                  <input type="number" min="0" step="0.01" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" value={formData.consultation_fee} onChange={e => setFormData({...formData, consultation_fee: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Languages</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" placeholder="English, Hindi" value={formData.languages} onChange={e => setFormData({...formData, languages: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone</label>
                  <input type="tel" className="w-full px-4 py-3 rounded-xl border border-slate-300 outline-none" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>
              
              <button type="submit" disabled={submitting} className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2 mt-4">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} 
                {submitting ? 'Saving...' : 'Save Doctor Details'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default HospitalDoctors;
