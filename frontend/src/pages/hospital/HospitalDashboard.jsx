import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Loader2, Users, Calendar, Building2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const HospitalDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/hospital/dashboard');
        setStats(res.data);
      } catch (err) {
        setError('Failed to load dashboard stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="h-full flex justify-center items-center"><Loader2 className="h-8 w-8 text-green-600 animate-spin" /></div>;

  if (error) return <div className="p-6"><div className="bg-red-50 text-red-700 p-4 rounded-xl flex items-center gap-2"><AlertCircle className="h-5 w-5" /> {error}</div></div>;

  const statCards = [
    { label: 'Pending Appointments', value: stats.pending_appointments, icon: Calendar, color: 'bg-orange-100 text-orange-600', link: '/hospital/appointments' },
    { label: "Today's Appointments", value: stats.today_appointments, icon: Users, color: 'bg-blue-100 text-blue-600', link: '/hospital/appointments' },
    { label: 'Total Doctors', value: stats.total_doctors, icon: Building2, color: 'bg-purple-100 text-purple-600', link: '/hospital/doctors' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Hospital Dashboard</h1>
      <p className="text-slate-500 mb-8">Overview of your facility's daily operations.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((card, idx) => (
          <Link key={idx} to={card.link} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition flex items-center gap-4">
            <div className={`p-4 rounded-xl ${card.color}`}>
              <card.icon className="h-8 w-8" />
            </div>
            <div>
              <p className="text-slate-500 text-sm font-medium">{card.label}</p>
              <h2 className="text-3xl font-bold text-slate-900">{card.value}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
export default HospitalDashboard;
