import React from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { HeartPulse, Home, Search, Calendar, FileText, Bell, PhoneCall, User, LogOut } from 'lucide-react';

const Layout = () => {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileName = user?.profile?.full_name || 'User';

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/dashboard', icon: Home, label: t('nav.home') },
    { path: '/find-care', icon: Search, label: t('nav.find_care') },
    { path: '/appointments', icon: Calendar, label: t('nav.appointments') },
    { path: '/health-records', icon: FileText, label: t('nav.health_records') },
    { path: '/reminders', icon: Bell, label: t('nav.reminders') },
    { path: '/profile', icon: User, label: t('nav.profile') },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-[#f8fafc]">
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-200 flex items-center gap-2">
          <HeartPulse className="text-slate-900 h-7 w-7" />
          <span className="text-xl font-bold text-slate-900 tracking-tight">SehatSetu</span>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 border-b border-slate-200 bg-[#f8fafc]">
          <p className="font-semibold text-slate-900 text-[13px] truncate">{profileName}</p>
          <p className="text-[11px] font-medium text-slate-500 tracking-wide truncate">{user?.phone_number}</p>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] transition ${
                isActive(item.path)
                  ? 'bg-slate-100 text-slate-900 font-semibold'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <item.icon className="h-[18px] w-[18px]" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 space-y-2 border-t border-slate-200">
          <Link to="/emergency" className={`flex items-center justify-center gap-2 p-2.5 rounded-[30px] font-medium text-[13px] transition ${
            isActive('/emergency') ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-white border border-slate-200 text-slate-700 hover:border-black'
          }`}>
            <PhoneCall className="h-4 w-4" /> {t('common.emergency')}
          </Link>
          <div className="flex gap-2">
             <LanguageSwitcher />
             <button onClick={handleLogout} className="flex-1 flex items-center justify-center gap-2 p-2.5 rounded-[30px] bg-slate-100 text-slate-700 font-medium text-[13px] hover:bg-slate-200 transition">
               <LogOut className="h-4 w-4" /> {t('logout')}
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-white p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-slate-900 h-6 w-6" />
            <span className="text-lg font-bold text-slate-900 tracking-tight">SehatSetu</span>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Link to="/emergency" className="bg-white border border-slate-200 text-slate-700 p-2 rounded-full font-bold">
              <PhoneCall className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white border-t border-slate-200 flex justify-around p-2 z-50">
        {[
          { path: '/dashboard', icon: Home, label: t('nav.home') },
          { path: '/find-care', icon: Search, label: t('nav.find_care') },
          { path: '/appointments', icon: Calendar, label: t('nav.appointments') },
          { path: '/profile', icon: User, label: t('nav.profile') },
        ].map((item) => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center p-1 ${isActive(item.path) ? 'text-slate-900' : 'text-slate-400'}`}>
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] mt-1 font-semibold tracking-wide uppercase">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default Layout;
