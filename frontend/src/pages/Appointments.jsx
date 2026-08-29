import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useTranslation } from 'react-i18next';
import {
  Calendar, Clock, Plus, X, Loader2, AlertCircle, CheckCircle2, User, Building2, Stethoscope
} from 'lucide-react';

const Appointments = () => {
  const location = useLocation();
  const voiceState = location.state || {};
  const voiceRef = useRef(voiceState);  // Persist voice state across re-renders
  const voiceProcessed = useRef(false); // Only auto-fill once

  const [appointments, setAppointments] = useState([]);
  const [facilities, setFacilities] = useState([]);
  const [specializations, setSpecializations] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    facility_id: '',
    specialization: '',
    doctor_id: '',
    preferred_date: '',
    preferred_time: '',
  });

  const fetchAppointments = async () => {
    try {
      const res = await api.get('/appointments/');
      setAppointments(res.data);
    } catch (err) {
      setError('Failed to load appointments');
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const [apptRes, facRes] = await Promise.allSettled([
          api.get('/appointments/'),
          api.get('/facilities/'),
        ]);
        if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data);
        if (facRes.status === 'fulfilled') {
          const loadedFacilities = facRes.value.data;
          setFacilities(loadedFacilities);

          // --- Voice auto-fill: run the entire chain sequentially ---
          const vs = voiceRef.current;
          if (vs.openForm && !voiceProcessed.current && loadedFacilities.length > 0) {
            voiceProcessed.current = true;
            setShowForm(true);
            await autoFillFromVoice(loadedFacilities, vs);
          }
        }
      } catch (err) {
        setError('Failed to load data');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Sequential auto-fill: facility → specialization → doctor → date/time
  const autoFillFromVoice = async (facs, vs) => {
    try {
      let selectedFacilityId = null;
      let selectedSpec = null;
      let selectedDoctorId = null;

      // Helper to match voice intent (e.g. "Gynecology") with DB entries (e.g. "Gynecologist")
      const findMatchingSpecialty = (requested, availableList) => {
        if (!requested || requested === 'None') return null;
        if (availableList.includes(requested)) return requested;
        
        // Use the first 6 characters as a root (e.g., "Gyneco", "Cardio", "Pediat")
        const root = requested.toLowerCase().substring(0, 6);
        return availableList.find(a => a.toLowerCase().startsWith(root)) || null;
      };

      // Step 1: Find a facility that has the requested specialty
      if (vs.specialty) {
        for (const fac of facs) {
          try {
            const specRes = await api.get(`/facilities/${fac.id}/specializations`);
            const matched = findMatchingSpecialty(vs.specialty, specRes.data);
            if (matched) {
              selectedFacilityId = fac.id;
              selectedSpec = matched;
              setSpecializations(specRes.data);
              break;
            }
          } catch (e) { continue; }
        }
      }

      // Fallback: use first facility if no specialty match found
      if (!selectedFacilityId) {
        selectedFacilityId = facs[0].id;
        try {
          const specRes = await api.get(`/facilities/${selectedFacilityId}/specializations`);
          setSpecializations(specRes.data);
          
          if (vs.specialty && vs.specialty !== "None") {
            const matched = findMatchingSpecialty(vs.specialty, specRes.data);
            selectedSpec = matched || '';
          } else {
            // User didn't request a specialty, so just pick the first one
            selectedSpec = specRes.data[0] || '';
          }
        } catch (e) { /* ignore */ }
      }

      // Step 2: Fetch doctors for the selected facility + specialization
      if (selectedFacilityId && selectedSpec) {
        try {
          const docRes = await api.get(`/facilities/${selectedFacilityId}/doctors`, {
            params: { specialization: selectedSpec }
          });
          setDoctors(docRes.data);
          if (docRes.data.length > 0) {
            // Try to match doctor by name if user specified one
            if (vs.doctorName) {
              const matchedDoc = docRes.data.find(d => 
                d.name.toLowerCase().includes(vs.doctorName.toLowerCase())
              );
              selectedDoctorId = matchedDoc ? matchedDoc.id : docRes.data[0].id;
            } else {
              selectedDoctorId = docRes.data[0].id;
            }
          }
        } catch (e) { /* ignore */ }
      }

      // Step 3: Use extracted date or default to tomorrow
      let dateStr;
      if (vs.preferredDate) {
        dateStr = vs.preferredDate;
      } else {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dateStr = tomorrow.toISOString().split('T')[0];
      }
      const timeStr = vs.preferredTime || '10:00';

      // Step 4: Update form with ALL values at once
      setFormData({
        facility_id: selectedFacilityId || '',
        specialization: selectedSpec || '',
        doctor_id: selectedDoctorId || '',
        preferred_date: dateStr,
        preferred_time: timeStr,
      });

      console.log('[Voice Auto-Fill]', { selectedFacilityId, selectedSpec, selectedDoctorId, dateStr, timeStr, doctorName: vs.doctorName });
    } catch (err) {
      console.error('Voice auto-fill failed:', err);
    }
  };

  // Normal (non-voice) cascading effects
  // Fetch specializations when facility changes manually
  useEffect(() => {
    // Skip if voice already handled the fill
    if (voiceProcessed.current) {
      return;
    }
    if (formData.facility_id) {
      api.get(`/facilities/${formData.facility_id}/specializations`)
        .then(res => {
          setSpecializations(res.data);
          setFormData(prev => ({ ...prev, specialization: '', doctor_id: '' }));
          setDoctors([]);
        })
        .catch(err => console.error(err));
    } else {
      setSpecializations([]);
    }
  }, [formData.facility_id]);

  // Fetch doctors when specialization changes manually
  useEffect(() => {
    // Skip if voice already handled the fill
    if (voiceProcessed.current) {
      voiceProcessed.current = false; // Reset here so future manual changes work
      return;
    }
    if (formData.facility_id && formData.specialization) {
      api.get(`/facilities/${formData.facility_id}/doctors`, {
        params: { specialization: formData.specialization }
      })
      .then(res => {
        setDoctors(res.data);
        setFormData(prev => ({ ...prev, doctor_id: '' }));
      })
      .catch(err => console.error(err));
    } else {
      setDoctors([]);
    }
  }, [formData.specialization]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    try {
      const payload = {
        facility_id: formData.facility_id,
        doctor_id: formData.doctor_id,
        preferred_date: formData.preferred_date,
        preferred_time: formData.preferred_time
      };
      await api.post('/appointments/', payload);
      setSuccess('Appointment request sent! Wait for hospital confirmation.');
      setShowForm(false);
      setFormData({ facility_id: '', specialization: '', doctor_id: '', preferred_date: '', preferred_time: '' });
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create appointment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!confirm('Cancel this appointment?')) return;
    try {
      await api.put(`/appointments/${id}/cancel`);
      await fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to cancel');
    }
  };

  const statusColors = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    CONFIRMED: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-slate-100 text-slate-600',
    COMPLETED: 'bg-blue-100 text-blue-800',
    REJECTED: 'bg-red-100 text-red-800',
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('appointments.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-green-600 text-white px-4 py-2 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? t('appointments.cancel') : t('appointments.book_new')}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm">
          <CheckCircle2 className="h-4 w-4" /> {success}
        </div>
      )}

      {/* Booking Form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border border-gray-100 mb-6 space-y-5 shadow-sm">
          <h3 className="font-bold text-gray-900 text-lg mb-2">{t('appointments.book_new')}</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Building2 className="h-4 w-4" /> Facility *</label>
            <select
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition"
              value={formData.facility_id}
              onChange={(e) => setFormData({ ...formData, facility_id: e.target.value })}
              required
            >
              <option value="">Select a hospital or clinic</option>
              {facilities.map((f) => (
                <option key={f.id} value={f.id}>{f.name} ({f.type})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Stethoscope className="h-4 w-4" /> Specialization *</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition disabled:bg-gray-50"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                required
                disabled={!formData.facility_id || specializations.length === 0}
              >
                <option value="">{formData.facility_id ? 'Select specialization' : 'Select facility first'}</option>
                {specializations.map((spec, idx) => (
                  <option key={idx} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><User className="h-4 w-4" /> Doctor *</label>
              <select
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition disabled:bg-gray-50"
                value={formData.doctor_id}
                onChange={(e) => setFormData({ ...formData, doctor_id: e.target.value })}
                required
                disabled={!formData.specialization || doctors.length === 0}
              >
                <option value="">{formData.specialization ? 'Select a doctor' : 'Select specialization first'}</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} {doc.consultation_fee ? `(₹${doc.consultation_fee})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Calendar className="h-4 w-4" /> Date *</label>
              <input
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition"
                value={formData.preferred_date}
                onChange={(e) => setFormData({ ...formData, preferred_date: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1"><Clock className="h-4 w-4" /> Time *</label>
              <input
                type="time"
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none transition"
                value={formData.preferred_time}
                onChange={(e) => setFormData({ ...formData, preferred_time: e.target.value })}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !formData.doctor_id}
            className="w-full bg-green-600 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-700 transition disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
          >
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Calendar className="h-5 w-5" />}
            {submitting ? t('common.loading') : t('appointments.book_btn')}
          </button>
        </form>
      )}

      {/* List */}
      {appointments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t('appointments.no_appointments')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appt) => (
            <div key={appt.id} className="bg-white p-5 rounded-2xl border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm hover:shadow-md transition">
              <div>
                <p className="font-semibold text-gray-900 text-lg">{t('dashboard.appt_with')} {appt.doctor?.name || 'Doctor'}</p>
                <p className="text-sm text-green-600 font-medium">{appt.doctor?.specialization}</p>
                <div className="flex items-center gap-3 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1"><Building2 className="h-3.5 w-3.5" /> {appt.facility?.name}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {appt.preferred_date} {t('dashboard.at')} {appt.preferred_time}</span>
                </div>
                {appt.status === 'REJECTED' && appt.decline_reason && (
                  <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-lg border border-red-100 inline-block">
                    <span className="font-bold">Declined Reason:</span> {appt.decline_reason}
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between md:flex-col md:items-end gap-3">
                <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${statusColors[appt.status] || ''}`}>
                  {t(`appointments.status.${appt.status}`) || appt.status}
                </span>
                {appt.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(appt.id)}
                    className="text-slate-500 hover:text-red-600 text-sm font-medium transition"
                  >
                    {t('appointments.cancel')}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Appointments;
