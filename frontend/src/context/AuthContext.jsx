import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sehatsetu_token'));
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/me');
      setUser(res.data);
      localStorage.setItem('sehatsetu_user', JSON.stringify(res.data));
    } catch (err) {
      // Token invalid or expired
      setToken(null);
      setUser(null);
      localStorage.removeItem('sehatsetu_token');
      localStorage.removeItem('sehatsetu_user');
    }
  }, []);

  // On mount: if token exists, hydrate user from API
  useEffect(() => {
    const init = async () => {
      if (token) {
        await fetchProfile();
      }
      setLoading(false);
    };
    init();
  }, [token, fetchProfile]);

  const login = async (phone_number, password) => {
    const res = await api.post('/auth/login', { phone_number, password });
    const { access_token } = res.data;
    localStorage.setItem('sehatsetu_token', access_token);
    setToken(access_token);
    // Fetch full user profile
    const profileRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(profileRes.data);
    localStorage.setItem('sehatsetu_user', JSON.stringify(profileRes.data));
    return profileRes.data;
  };

  const qrLogin = async (qrToken) => {
    const res = await api.post('/auth/qr-login', { token: qrToken });
    const { access_token } = res.data;
    localStorage.setItem('sehatsetu_token', access_token);
    setToken(access_token);
    const profileRes = await api.get('/auth/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });
    setUser(profileRes.data);
    localStorage.setItem('sehatsetu_user', JSON.stringify(profileRes.data));
    return profileRes.data;
  };

  const register = async (userData) => {
    const res = await api.post('/auth/register', userData);
    return res.data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('sehatsetu_token');
    localStorage.removeItem('sehatsetu_user');
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/users/me', profileData);
    setUser(res.data);
    localStorage.setItem('sehatsetu_user', JSON.stringify(res.data));
    return res.data;
  };

  const isHospitalUser = user && ['HEALTH_WORKER', 'ADMIN'].includes(user.role) && user.managed_facility_id;

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!token && !!user,
    isHospitalUser,
    login,
    qrLogin,
    register,
    logout,
    updateProfile,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

