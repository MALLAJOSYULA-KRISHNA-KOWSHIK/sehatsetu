import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

const HospitalProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 text-green-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isHospital = Boolean(user?.role && ['HEALTH_WORKER', 'ADMIN'].includes(user.role) && user.managed_facility_id);
  if (!isHospital) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default HospitalProtectedRoute;
