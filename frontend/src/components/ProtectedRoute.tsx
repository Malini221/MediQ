import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { session, loading } = useAuth();

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

  // Render child routes
  return <Outlet />;
}
