import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { PhoneCall, Plus, X, Trash2, Loader2, AlertCircle, CheckCircle2, Edit, User } from 'lucide-react';

const Emergency = () => {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ name: '', relationship_type: '', phone_number: '' });

  const fetchContacts = async () => {
    try { const res = await api.get('/emergency-contacts/'); setContacts(res.data); } catch { setError('Failed to load contacts'); }
  };
  useEffect(() => { fetchContacts().finally(() => setLoading(false)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      await api.post('/emergency-contacts/', formData);
      setSuccess('Contact added!'); setShowForm(false);
      setFormData({ name: '', relationship_type: '', phone_number: '' });
      await fetchContacts();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to add contact'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this contact?')) return;
    try { await api.delete(`/emergency-contacts/${id}`); await fetchContacts(); } catch { setError('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full p-12"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Emergency Banner */}
      <div className="bg-red-600 text-white p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">{t('emergency.title')}</h1>
          <p className="text-red-100 mt-1">If this is a medical emergency, call immediately</p>
        </div>
        <a href="tel:112" className="bg-white text-red-600 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition flex items-center gap-2 text-lg">
          <PhoneCall className="h-6 w-6" /> {t('emergency.call_ambulance')} (112)
        </a>
      </div>

      {/* Contacts Section */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">{t('emergency.contacts')}</h2>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? t('appointments.cancel') : t('reminders.add_new')}
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-gray-100 mb-6 space-y-4">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.full_name')} *</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" placeholder="Contact name" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" placeholder="e.g. Family member, Doctor" value={formData.relationship_type} onChange={(e) => setFormData({...formData, relationship_type: e.target.value})} required /></div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('auth.phone')} *</label><input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" placeholder="9876543210" value={formData.phone_number} onChange={(e) => setFormData({...formData, phone_number: e.target.value})} required /></div>
          <button type="submit" disabled={submitting} className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} {submitting ? t('common.loading') : t('reminders.save')}
          </button>
        </form>
      )}

      {contacts.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center"><User className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">No emergency contacts added</p></div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => (
            <div key={c.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-red-50 p-3 rounded-xl"><User className="h-6 w-6 text-red-600" /></div>
                <div><p className="font-semibold text-gray-800">{c.name}</p><p className="text-sm text-gray-500">{c.relationship_type} • {c.phone_number}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <a href={`tel:${c.phone_number}`} className="bg-green-50 text-green-700 p-2 rounded-lg hover:bg-green-100"><PhoneCall className="h-4 w-4" /></a>
                <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Emergency;
