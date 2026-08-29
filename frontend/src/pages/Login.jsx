import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { HeartPulse, Loader2, AlertCircle, QrCode, Phone } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import QRScanner from '../components/QRScanner';

const Login = () => {
  const [loginMethod, setLoginMethod] = useState('phone'); // 'phone' or 'qr'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { login, qrLogin } = useAuth();
  const { t } = useTranslation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userData = await login(phone, password);
      redirectUser(userData);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setError(detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanSuccess = async (qrToken) => {
    setError('');
    setLoading(true);
    try {
      const userData = await qrLogin(qrToken);
      redirectUser(userData);
    } catch (err) {
      setError('Invalid or expired QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const redirectUser = (userData) => {
    const isHospital = Boolean(userData?.role && ['HEALTH_WORKER', 'ADMIN'].includes(userData.role) && userData.managed_facility_id);
    
    if (isHospital) {
      // Always force hospital users to the hospital dashboard
      navigate('/hospital/dashboard', { replace: true });
    } else {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200">
        <div className="flex flex-col items-center mb-6">
          <HeartPulse className="text-slate-900 h-10 w-10 mb-3" />
          <h2 className="text-[24px] font-bold text-slate-900 tracking-tight">{t('auth.login_title')}</h2>
          <p className="text-slate-500 mt-2 text-[13px] text-center font-medium">
            {loginMethod === 'phone' ? 'Enter your credentials to access the portal' : 'Scan your Health ID QR code'}
          </p>
        </div>

        {/* Login Method Toggle */}
        <div className="flex bg-slate-100 p-1 rounded-xl mb-8">
          <button
            onClick={() => setLoginMethod('phone')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold rounded-lg transition-all ${
              loginMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Phone className="h-4 w-4" /> Phone
          </button>
          <button
            onClick={() => setLoginMethod('qr')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 text-[13px] font-semibold rounded-lg transition-all ${
              loginMethod === 'qr' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <QrCode className="h-4 w-4" /> QR Code
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {loginMethod === 'phone' ? (
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-[13px] font-semibold text-slate-900 mb-1">{t('auth.phone')}</label>
            <input
              type="tel"
              className="w-full px-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition"
              placeholder="8888888888"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-slate-900 mb-1">{t('auth.password')}</label>
            <input
              type="password"
              className="w-full px-4 py-2.5 rounded-[30px] border border-slate-200 text-[13px] focus:ring-3 focus:ring-slate-100 focus:border-slate-300 outline-none transition"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-black text-white font-medium text-[14px] rounded-[30px] hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('common.loading')}
              </>
            ) : (
              t('auth.login_btn')
            )}
          </button>
        </form>
        ) : (
          <QRScanner onScanSuccess={handleQRScanSuccess} onScanError={(err) => console.log('QR Scan error:', err)} />
        )}

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-[13px]">
            {t('auth.no_account')} <Link to="/register" className="text-slate-900 font-bold hover:underline">{t('auth.register_btn')}</Link>
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-900 text-[11px] uppercase tracking-widest font-semibold mb-1">Patient Demo</p>
            <p className="text-slate-500 text-[12px]">Phone <span className="font-mono font-bold text-slate-700">8888888888</span> • Pass <span className="font-mono font-bold text-slate-700">Demo@123</span></p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <p className="text-slate-900 text-[11px] uppercase tracking-widest font-semibold mb-1">Hospital Demo</p>
            <p className="text-slate-500 text-[12px]">Phone <span className="font-mono font-bold text-slate-700">9999999999</span> • Pass <span className="font-mono font-bold text-slate-700">Demo@123</span></p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
