import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { User, MapPin, Phone, Mail, Edit, LogOut, Loader2, AlertCircle, CheckCircle2, Save, Download, QrCode } from 'lucide-react';
import QRCode from 'react-qr-code';
import api from '../api/axios';

const Profile = () => {
  const { user, logout, updateProfile, token } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [qrToken, setQrToken] = useState('');
  const { t } = useTranslation();
  const qrRef = useRef();

  const [formData, setFormData] = useState({
    full_name: user?.profile?.full_name || '',
    date_of_birth: user?.profile?.date_of_birth || '',
    gender: user?.profile?.gender || 'MALE',
    village_town: user?.profile?.village_town || '',
    district: user?.profile?.district || '',
    state: user?.profile?.state || '',
    preferred_language: user?.profile?.preferred_language || 'en',
  });

  useEffect(() => {
    const fetchQrToken = async () => {
      try {
        const res = await api.get('/auth/qr-token', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setQrToken(res.data.qr_token);
      } catch (err) {
        console.error("Could not fetch QR token", err);
      }
    };
    if (token) fetchQrToken();
  }, [token]);

  const handleUpdate = async (e) => {
    e.preventDefault(); setSubmitting(true); setError(''); setSuccess('');
    try {
      await updateProfile(formData);
      setSuccess('Profile updated!'); setEditing(false);
    } catch (err) { setError(err.response?.data?.detail || 'Update failed'); }
    finally { setSubmitting(false); }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const handleDownloadQR = () => {
    const svg = qrRef.current.querySelector('svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width + 40;
      canvas.height = img.height + 80;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 20, 20);
      ctx.fillStyle = "black";
      ctx.font = "bold 20px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(user?.profile?.full_name || "SehatSetu Health ID", canvas.width / 2, canvas.height - 20);
      
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `HealthID_${user?.phone_number}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  const profile = user?.profile;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">{t('profile.title')}</h1>
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="h-4 w-4" /> {error}</div>}
      {success && <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 text-sm"><CheckCircle2 className="h-4 w-4" /> {success}</div>}

      {!editing ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-green-50 p-4 rounded-full"><User className="h-10 w-10 text-green-600" /></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{profile?.full_name || 'User'}</h2>
              <p className="text-gray-500 capitalize">{user?.role?.toLowerCase()}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-gray-600"><Phone className="h-4 w-4 text-gray-400" /> {user?.phone_number}</div>
            {user?.email && <div className="flex items-center gap-2 text-gray-600"><Mail className="h-4 w-4 text-gray-400" /> {user.email}</div>}
            <div className="flex items-center gap-2 text-gray-600"><MapPin className="h-4 w-4 text-gray-400" /> {profile?.village_town}, {profile?.district}</div>
            <div className="flex items-center gap-2 text-gray-600">{t('profile.state')}: {profile?.state}</div>
            <div className="flex items-center gap-2 text-gray-600">{t('profile.gender')}: {profile?.gender}</div>
            <div className="flex items-center gap-2 text-gray-600">{t('profile.dob')}: {profile?.date_of_birth}</div>
          </div>
          <div className="flex gap-3 mt-6 pt-4 border-t border-gray-100">
            <button onClick={() => setEditing(true)} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 transition flex items-center gap-2"><Edit className="h-4 w-4" /> {t('profile.edit')}</button>
            <button onClick={handleLogout} className="bg-red-50 text-red-600 px-5 py-2.5 rounded-xl font-medium hover:bg-red-100 transition flex items-center gap-2"><LogOut className="h-4 w-4" /> {t('logout')}</button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="bg-white p-6 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.full_name')}</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.full_name} onChange={(e) => setFormData({...formData, full_name: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.dob')}</label><input type="date" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.date_of_birth} onChange={(e) => setFormData({...formData, date_of_birth: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.gender')}</label><select className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.gender} onChange={(e) => setFormData({...formData, gender: e.target.value})}><option value="MALE">Male</option><option value="FEMALE">Female</option><option value="OTHER">Other</option></select></div>
          </div>
          <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.village')}</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.village_town} onChange={(e) => setFormData({...formData, village_town: e.target.value})} required /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.district')}</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.district} onChange={(e) => setFormData({...formData, district: e.target.value})} required /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">{t('profile.state')}</label><input type="text" className="w-full px-4 py-3 rounded-xl border border-gray-300 outline-none" value={formData.state} onChange={(e) => setFormData({...formData, state: e.target.value})} required /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" disabled={submitting} className="bg-green-600 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {submitting ? t('common.loading') : t('profile.save')}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="bg-gray-100 text-gray-600 px-5 py-2.5 rounded-xl font-medium hover:bg-gray-200">{t('appointments.cancel')}</button>
          </div>
        </form>
      )}

      {/* QR Code Health ID Section */}
      {!editing && qrToken && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex-1 space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 text-green-600 mb-2">
              <QrCode className="h-6 w-6" />
              <h3 className="text-xl font-bold">Health ID QR Code</h3>
            </div>
            <p className="text-gray-500 text-sm">
              Use this QR code to quickly log in to your SehatSetu account on any kiosk or device. Keep this safe!
            </p>
            <button 
              onClick={handleDownloadQR}
              className="mt-4 bg-gray-900 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-gray-800 transition flex items-center justify-center md:justify-start gap-2 mx-auto md:mx-0"
            >
              <Download className="h-4 w-4" /> Download QR
            </button>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm" ref={qrRef}>
            <QRCode value={qrToken} size={150} level="H" />
          </div>
        </div>
      )}
    </div>
  );
};
export default Profile;
