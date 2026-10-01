import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { session, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-mediq-blue border-t-transparent animate-spin"></div>
          <p className="mt-4 text-mediq-slate font-medium">Verifying Session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    // Redirect to login if unauthenticated
    return <Navigate to="/" replace />;
  }

  // Role-Based Isolation Guard
  const isPatientRoute = location.pathname.startsWith('/dashboard/patient') || location.pathname.startsWith('/dashboard/reports');
  
  if (role === 'patient' && !isPatientRoute && !location.pathname.startsWith('/dashboard/settings') && !location.pathname.startsWith('/dashboard/notifications') && !location.pathname.startsWith('/dashboard/guidance')) {
    return <Navigate to="/dashboard/patient" replace />;
  }

  if (role !== 'patient' && isPatientRoute) {
    return <Navigate to="/dashboard/overview" replace />;
  }

  // Render child routes
  return <Outlet />;
}
