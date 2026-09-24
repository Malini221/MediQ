import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PublicRoute() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-mediq-blue border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (session && role) {
    if (window.location.pathname === '/auth/patient' && role !== 'patient') {
      // Allow PatientAuthPage to remain mounted so it can display the error message and sign the user out
      return <Outlet />;
    }
    
    // Redirect authenticated users to their respective dashboards
    if (role === 'patient') {
      return <Navigate to="/dashboard/patient" replace />;
    }
    return <Navigate to="/dashboard/overview" replace />;
  }

  // Render child routes (Login/Signup/Landing)
  return <Outlet />;
}
