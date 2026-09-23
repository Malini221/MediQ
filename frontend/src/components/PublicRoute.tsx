import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function PublicRoute() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-mediq-blue border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  if (session) {
    // Redirect authenticated users to the dashboard instead of letting them see Login/Signup
    return <Navigate to="/dashboard/overview" replace />;
  }

  // Render child routes (Login/Signup)
  return <Outlet />;
}
