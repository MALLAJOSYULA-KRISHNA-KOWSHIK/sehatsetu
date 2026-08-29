import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import {
  Search, Calendar, FileText, Bell, PhoneCall, HeartPulse,
  MapPin, Clock, Loader2, ChevronRight, Pill, AlertCircle, Mic, MessageSquare
} from 'lucide-react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';
import HomeRemedyChat from '../components/HomeRemedyChat';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isListening, isProcessing, error: voiceError, transcript, startListening } = useVoiceAssistant();
  const [appointments, setAppointments] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptRes, reminderRes] = await Promise.allSettled([
          api.get('/appointments/'),
          api.get('/medicine-reminders'),
        ]);
        if (apptRes.status === 'fulfilled') setAppointments(apptRes.value.data);
        if (reminderRes.status === 'fulfilled') setReminders(reminderRes.value.data);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const profileName = user?.profile?.full_name || 'User';
  const location = user?.profile?.village_town
    ? `${user.profile.village_town}, ${user.profile.district}`
    : '';

  const quickActions = [
    { icon: <Search className="h-5 w-5 text-white" />, label: 'Find Hospital', subtitle: t('dashboard.find_hospital'), path: '/find-care' },
    { icon: <Calendar className="h-5 w-5 text-white" />, label: 'Appointments', subtitle: t('dashboard.book_appt'), path: '/appointments' },
    { icon: <FileText className="h-5 w-5 text-white" />, label: 'Records', subtitle: t('dashboard.health_records'), path: '/health-records' },
    { icon: <Bell className="h-5 w-5 text-white" />, label: 'Reminders', subtitle: t('dashboard.reminders'), path: '/reminders' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-12">
        <Loader2 className="h-8 w-8 text-slate-900 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 pt-8 max-w-7xl mx-auto mt-2 md:mt-4">
      {/* Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-[24px] font-bold text-slate-900 tracking-tight leading-tight">{t('dashboard.hello')}, {profileName}</h1>
          {location && (
            <p className="text-slate-500 mt-1 flex items-center gap-1 text-[13px]">
              <MapPin className="h-4 w-4" /> {location}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/emergency" className="h-10 px-5 flex items-center justify-center bg-brand text-white text-[13px] font-medium rounded-[30px] hover:bg-brand-hover transition">
            <PhoneCall className="h-4 w-4 mr-2" /> {t('dashboard.emergency')}
          </Link>
        </div>
      </div>

      {/* Metric Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
        {quickActions.map((action, idx) => (
          <Link
            key={idx}
            to={action.path}
            className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between hover:border-slate-300 transition-colors shadow-none group"
          >
            <div className="flex items-start justify-between mb-4">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{action.label}</span>
              <div className="h-12 w-12 bg-slate-900 rounded-2xl flex items-center justify-center group-hover:bg-slate-800 transition-colors">
                {action.icon}
              </div>
            </div>
            <div>
              <p className="text-[20px] font-bold text-slate-900 leading-none tracking-tight">{action.subtitle}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Upcoming Appointments */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">{t('dashboard.upcoming_appts')}</h2>
          <Link to="/appointments" className="text-slate-600 text-[12px] font-medium flex items-center hover:text-slate-900">
            {t('dashboard.view_all')} <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
        {appointments.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
            <Calendar className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500">{t('dashboard.no_upcoming_appts')}</p>
            <Link to="/appointments" className="h-10 px-5 mt-4 inline-flex items-center justify-center bg-black text-white text-[13px] font-medium rounded-[30px] hover:bg-slate-800 transition">
              {t('dashboard.book_first_appt')}
            </Link>
          </div>
        ) : (
          <div className="space-y-0 border border-slate-200 rounded-2xl bg-white overflow-hidden">
            {appointments.slice(0, 3).map((appt, idx) => (
              <div key={appt.id} className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${idx !== 0 ? 'border-t border-slate-200' : ''}`}>
                <div>
                  <p className="font-semibold text-slate-900 text-[14px]">{t('dashboard.appt_with')} {appt.doctor?.name || 'Doctor'}</p>
                  <p className="text-[12px] text-slate-500 flex items-center mt-1">
                    <Clock className="h-3.5 w-3.5 mr-1.5 opacity-70" />
                    {appt.preferred_date} {t('dashboard.at')} {appt.preferred_time}
                  </p>
                </div>
                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wide self-start sm:self-auto ${
                  appt.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700' :
                  appt.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                  appt.status === 'CANCELLED' ? 'bg-red-50 text-red-700' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  {appt.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Active Reminders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[14px] font-semibold text-slate-900 tracking-tight">{t('dashboard.medicine_reminders')}</h2>
          <Link to="/reminders" className="text-slate-600 text-[12px] font-medium flex items-center hover:text-slate-900">
            {t('dashboard.view_all')} <ChevronRight className="h-3 w-3 ml-1" />
          </Link>
        </div>
        {reminders.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center">
            <Pill className="h-8 w-8 text-slate-300 mx-auto mb-3" />
            <p className="text-[13px] text-slate-500">{t('dashboard.no_active_reminders')}</p>
            <Link to="/reminders" className="h-10 px-5 mt-4 inline-flex items-center justify-center bg-black text-white text-[13px] font-medium rounded-[30px] hover:bg-slate-800 transition">
              {t('dashboard.add_reminder')}
            </Link>
          </div>
        ) : (
          <div className="space-y-0 border border-slate-200 rounded-2xl bg-white overflow-hidden">
            {reminders.slice(0, 3).map((r, idx) => (
              <div key={r.id} className={`p-4 flex items-center justify-between ${idx !== 0 ? 'border-t border-slate-200' : ''}`}>
                <div className="flex items-center gap-3">
                  <div className="bg-slate-100 p-2 rounded-xl">
                    <Pill className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-[14px]">{r.medicine_name}</p>
                    <p className="text-[12px] text-slate-500">{r.frequency} • {r.dosage}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Transcript Bubble */}
      {(isListening || isProcessing || transcript) && (
        <div className={`fixed bottom-24 right-6 md:bottom-28 md:right-10 z-50 px-4 py-3 rounded-xl shadow-2xl max-w-sm text-sm font-medium transition-all ${
          isListening ? 'bg-red-600 text-white animate-pulse' :
          isProcessing ? 'bg-orange-500 text-white' :
          'bg-gray-800 text-white'
        }`}>
          {isListening && '🎤 Listening...'}
          {isProcessing && '🧠 Processing...'}
          {!isListening && !isProcessing && transcript && (
            <span>🗣️ "{transcript}"</span>
          )}
        </div>
      )}

      {/* Voice Error Toast */}
      {voiceError && (
        <div className="fixed bottom-40 right-6 md:bottom-44 md:right-10 z-50 bg-red-600 text-white px-4 py-3 rounded-xl shadow-2xl max-w-xs text-sm font-medium">
          ⚠️ {voiceError}
        </div>
      )}

      {/* Voice Assistant FAB */}
      <button
        onClick={startListening}
        disabled={isListening || isProcessing}
        className={`fixed bottom-6 right-6 md:bottom-10 md:right-10 p-4 rounded-full shadow-2xl transition-all z-50 flex items-center justify-center border-2 ${
          isListening ? 'bg-red-600 border-red-400 text-white animate-pulse scale-110' :
          isProcessing ? 'bg-orange-500 border-orange-400 text-white' :
          'bg-green-600 border-green-500 text-white hover:bg-green-700 hover:scale-105'
        }`}
        title="Talk to SehatSetu"
      >
        <Mic className={`h-8 w-8 ${isListening ? 'animate-bounce' : ''}`} />
      </button>

      {/* Home Remedy Chat FAB (Above Mic) */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-[90px] right-6 md:bottom-[110px] md:right-10 p-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-xl transition-all z-50 flex items-center justify-center border-2 border-blue-500 hover:scale-105"
        title="Home Remedy Chat"
      >
        <MessageSquare className="h-6 w-6" />
      </button>

      {/* Home Remedy Chat UI */}
      {isChatOpen && <HomeRemedyChat onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default Dashboard;
