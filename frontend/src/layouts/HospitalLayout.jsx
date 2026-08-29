import React, { useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { HeartPulse, Home, Calendar, Users, FileText, User, LogOut, Building2 } from 'lucide-react';

const HospitalLayout = () => {
  const { i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const profileName = user?.profile?.full_name || 'Hospital Admin';

  useEffect(() => {
    // Force English for hospital operations
    if (i18n.language !== 'en') {
      i18n.changeLanguage('en');
    }
  }, [i18n]);

  const handleLogout = () => { logout(); navigate('/login'); };

  const navItems = [
    { path: '/hospital/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/hospital/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/hospital/doctors', icon: Building2, label: 'Doctors' },
    { path: '/hospital/patients', icon: Users, label: 'Patients' },
    { path: '/hospital/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar for Desktop */}
      <aside className="w-64 bg-slate-900 text-white hidden md:flex flex-col">
        <div className="p-4 border-b border-slate-700 flex items-center gap-2">
          <HeartPulse className="text-green-400 h-8 w-8" />
          <span className="text-xl font-bold">SehatSetu <span className="text-sm font-normal text-slate-400">Hospital</span></span>
        </div>

        {/* User Info */}
        <div className="px-4 py-4 border-b border-slate-700 bg-slate-800">
          <p className="font-semibold text-white text-sm truncate">{profileName}</p>
          <p className="text-xs text-slate-400 truncate">Staff ID: {user?.id.substring(0,8)}</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-[30px] text-[13px] font-semibold transition ${
                isActive(item.path)
                  ? 'bg-black text-white'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" /> {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700 space-y-2">
          <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-slate-800 text-slate-300 font-medium hover:bg-slate-700 hover:text-white transition">
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto">
        {/* Mobile Header */}
        <header className="md:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <HeartPulse className="text-slate-100 h-6 w-6" />
            <span className="text-lg font-bold">Hospital Panel</span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 pb-16 md:pb-0">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-slate-900 border-t border-slate-700 flex justify-around p-3 z-50">
        {[
          { path: '/hospital/dashboard', icon: Home, label: 'Dash' },
          { path: '/hospital/appointments', icon: Calendar, label: 'Appt' },
          { path: '/hospital/doctors', icon: Building2, label: 'Docs' },
          { path: '/hospital/patients', icon: Users, label: 'Pts' },
        ].map((item) => (
          <Link key={item.path} to={item.path} className={`flex flex-col items-center ${isActive(item.path) ? 'text-slate-100' : 'text-slate-500'}`}>
            <item.icon className="h-6 w-6" />
            <span className="text-[10px] mt-1 font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
};

export default HospitalLayout;
