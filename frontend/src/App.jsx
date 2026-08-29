import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import FindCare from './pages/FindCare';
import Emergency from './pages/Emergency';
import Appointments from './pages/Appointments';
import HealthInfo from './pages/HealthInfo';
import HealthRecords from './pages/HealthRecords';
import Reminders from './pages/Reminders';
import Profile from './pages/Profile';
import Layout from './layouts/Layout';
import OfflineBanner from './components/OfflineBanner';

// Hospital Pages
import HospitalLayout from './layouts/HospitalLayout';
import HospitalProtectedRoute from './components/HospitalProtectedRoute';
import HospitalDashboard from './pages/hospital/HospitalDashboard';
import HospitalAppointments from './pages/hospital/HospitalAppointments';
import HospitalDoctors from './pages/hospital/HospitalDoctors';
import HospitalPatients from './pages/hospital/HospitalPatients';

function App() {
  return (
    <AuthProvider>
      <OfflineBanner />
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/health-info" element={<HealthInfo />} />

          {/* Protected routes with sidebar layout */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/find-care" element={<FindCare />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/appointments" element={<Appointments />} />
            <Route path="/health-records" element={<HealthRecords />} />
            <Route path="/reminders" element={<Reminders />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          {/* Hospital Protected Routes */}
          <Route path="/hospital" element={
            <HospitalProtectedRoute>
              <HospitalLayout />
            </HospitalProtectedRoute>
          }>
            <Route index element={<HospitalDashboard />} />
            <Route path="dashboard" element={<HospitalDashboard />} />
            <Route path="appointments" element={<HospitalAppointments />} />
            <Route path="doctors" element={<HospitalDoctors />} />
            <Route path="patients" element={<HospitalPatients />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
