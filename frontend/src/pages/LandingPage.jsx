import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { Mic, HeartPulse, ShieldAlert, CalendarClock, Pill, PhoneCall } from 'lucide-react';
import useVoiceAssistant from '../hooks/useVoiceAssistant';

const LandingPage = () => {
  const { t } = useTranslation();
  const { isListening, isProcessing, error: voiceError, startListening } = useVoiceAssistant();



  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-slate-900 h-7 w-7" />
            <span className="text-[20px] font-bold text-slate-900 tracking-tight">SehatSetu</span>
          </div>
          <nav className="hidden md:flex gap-6">
            <Link to="/find-care" className="text-[14px] text-slate-600 hover:text-slate-900 font-medium">{t('nav.find_care')}</Link>
            <Link to="/health-info" className="text-[14px] text-slate-600 hover:text-slate-900 font-medium">{t('health_info')}</Link>
            <Link to="/appointments" className="text-[14px] text-slate-600 hover:text-slate-900 font-medium">{t('nav.appointments')}</Link>
          </nav>
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
            <Link to="/emergency" className="text-slate-600 font-medium hover:text-slate-900 text-[14px]">{t('common.emergency')}</Link>
            <Link to="/login" className="h-10 px-5 inline-flex items-center justify-center bg-black text-white text-[14px] font-medium rounded-[30px] hover:bg-slate-800 transition">
              {t('login')}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-4xl mx-auto mt-12">
        <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
          {t('welcome')}
        </h1>
        <p className="text-lg md:text-xl text-slate-600 mb-10 max-w-2xl">
          {t('landing.subtitle')}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center items-center">
          <Link to="/find-care" className="h-12 px-8 inline-flex items-center justify-center bg-black text-white text-[15px] font-medium rounded-[30px] hover:bg-slate-800 transition gap-2 w-full sm:w-auto">
            <HeartPulse className="h-5 w-5" /> {t('landing.find_healthcare')}
          </Link>
          <button 
            onClick={startListening}
            disabled={isListening || isProcessing}
            className={`h-12 px-8 inline-flex items-center justify-center text-[15px] font-medium rounded-[30px] border transition gap-2 w-full sm:w-auto ${
              isListening ? 'bg-red-50 border-red-200 text-red-600 animate-pulse' :
              isProcessing ? 'bg-amber-50 border-amber-200 text-amber-600' :
              'bg-white text-slate-700 border-slate-200 hover:border-slate-900 hover:text-slate-900'
            }`}
          >
            <Mic className={`h-5 w-5 ${isListening ? 'animate-bounce' : ''}`} /> 
            {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : t('talk_to_us')}
          </button>
        </div>

        {voiceError && (
          <p className="text-red-600 text-[13px] font-medium mt-4 bg-red-50 px-4 py-2 rounded-[30px] border border-red-200">{voiceError}</p>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 w-full">
          {[
            { icon: <ShieldAlert className="h-6 w-6 text-slate-900" />, label: t('health_info') },
            { icon: <CalendarClock className="h-6 w-6 text-slate-900" />, label: t('nav.appointments') },
            { icon: <Pill className="h-6 w-6 text-slate-900" />, label: t('dashboard.reminders') },
            { icon: <PhoneCall className="h-6 w-6 text-slate-900" />, label: t('emergency') }
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center gap-3 hover:border-slate-300 transition cursor-pointer">
              <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center mb-1">
                {item.icon}
              </div>
              <span className="font-semibold text-slate-900 text-[14px]">{item.label}</span>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-[#f8fafc] p-6 rounded-2xl border border-slate-200 max-w-3xl">
          <p className="text-slate-500 font-medium text-[13px] leading-relaxed">
            <ShieldAlert className="inline h-4 w-4 mr-2 text-slate-400" />
            {t('landing.disclaimer')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default LandingPage;
