import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import { Bell, Plus, X, Trash2, Loader2, AlertCircle, CheckCircle2, Pill, Clock, Edit } from 'lucide-react';

const Reminders = () => {
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    medicine_name: '', dosage_text: '', frequency: 'Daily',
    start_date: '', end_date: '', reminder_time: '', instructions: ''
  });

  const fetchReminders = async () => {
    try { const res = await api.get('/medicine-reminders'); setReminders(res.data); } catch { setError('Failed to load reminders'); }
  };
  useEffect(() => { fetchReminders().finally(() => setLoading(false)); }, []);

  const handleCreate = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      const payload = { ...formData, end_date: formData.end_date || null };
      await api.post('/medicine-reminders', payload);
      setSuccess('Reminder added!'); setShowForm(false);
      setFormData({ medicine_name: '', dosage_text: '', frequency: 'Daily', start_date: '', end_date: '', reminder_time: '', instructions: '' });
      await fetchReminders();
    } catch (err) { setError(err.response?.data?.detail || 'Failed to create'); }
    finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this reminder?')) return;
    try { await api.delete(`/medicine-reminders/${id}`); await fetchReminders(); } catch { setError('Failed to delete'); }
  };

  if (loading) return <div className="flex items-center justify-center h-full p-12"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('reminders.title')}</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} {showForm ? t('appointments.cancel') : t('reminders.add_new')}
        </button>
      </div>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-gray-100 mb-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders.medicine_name')} *</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" placeholder="e.g. Paracetamol" value={formData.medicine_name} onChange={(e) => setFormData({...formData, medicine_name: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders.dosage')} *</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" placeholder="e.g. 500mg" value={formData.dosage_text} onChange={(e) => setFormData({...formData, dosage_text: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders.frequency')}</label><select className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.frequency} onChange={(e) => setFormData({...formData, frequency: e.target.value})}><option>Daily</option><option>Twice Daily</option><option>Weekly</option><option>As Needed</option></select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('reminders.time')} *</label><input type="time" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.reminder_time} onChange={(e) => setFormData({...formData, reminder_time: e.target.value})} required /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label><input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.start_date} onChange={(e) => setFormData({...formData, start_date: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">End Date</label><input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.end_date} onChange={(e) => setFormData({...formData, end_date: e.target.value})} /></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" placeholder="e.g. After food" value={formData.instructions} onChange={(e) => setFormData({...formData, instructions: e.target.value})} /></div>
          <button type="submit" disabled={submitting} className="bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} {submitting ? t('common.loading') : t('reminders.save')}
          </button>
        </form>
      )}

      {reminders.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center"><Pill className="h-12 w-12 text-gray-300 mx-auto mb-3" /><p className="text-gray-500">{t('reminders.no_reminders')}</p></div>
      ) : (
        <div className="space-y-3">
          {reminders.map((r) => (
            <div key={r.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-orange-50 p-3 rounded-xl"><Pill className="h-6 w-6 text-orange-600" /></div>
                <div>
                  <p className="font-semibold text-gray-800">{r.medicine_name} — {r.dosage_text}</p>
                  <p className="text-sm text-gray-500">{r.frequency} • {r.reminder_time}</p>
                  {r.instructions && <p className="text-xs text-gray-400 mt-0.5">{r.instructions}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(r.id)} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
export default Reminders;
