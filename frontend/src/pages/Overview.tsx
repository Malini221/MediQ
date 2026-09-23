import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Link } from 'react-router-dom';
import { Activity, Users, ClipboardList, Stethoscope, ChevronRight } from '@/components/common/Icon';
import { cn } from '../lib/utils';
import { LoadingState } from '../components/ui/states';
import { Navigate } from 'react-router-dom';

interface UserProfile {
  user_id: string;
  // Full profile structure will be implemented in a future phase
  // full_name, role, etc.
}

export function Overview() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    async function fetchProfileData() {
      try {
        // Scaffolding for retrieving the profile.
        // Currently hitting the existing auth verify endpoint.
        const authData = await apiClient.get<UserProfile>('/api/v1/auth/me');
        console.log("Profile skeleton fetched:", authData.user_id);
      } catch (e) {
        console.error("Failed to fetch profile");
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProfileData();
    }
  }, [user]);

  if (loading) {
    return <LoadingState message="Loading dashboard..." className="h-[60vh]" />;
  }

  // Parse role from user metadata
  const systemRole = user?.user_metadata?.system_role;
  
  if (systemRole === 'patient') {
    return <Navigate to="/dashboard/patient" replace />;
  } else if (systemRole === 'clinician') {
    return <Navigate to="/dashboard/clinician" replace />;
  } else if (systemRole === 'coordinator') {
    return <Navigate to="/dashboard/coordinator" replace />;
  } else if (systemRole === 'professional_caregiver') {
    return <Navigate to="/dashboard/professional" replace />;
  } else if (systemRole === 'family_caregiver') {
    return <Navigate to="/dashboard/family" replace />;
  }

  // Parse name from user metadata if available (added during signup)
  const displayName = user?.user_metadata?.full_name || 'Caregiver';

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-10">
      <header className="space-y-3 bg-white p-8 rounded-[24px] border border-border shadow-sm">
        <p className="text-sm font-semibold text-mediq-blue tracking-wider uppercase">Overview</p>
        <h1 className="font-heading text-3xl md:text-4xl font-bold text-mediq-navy tracking-tight">
          Welcome back, {displayName}
        </h1>
        <p className="text-lg text-mediq-slate max-w-2xl">
          Here's what's happening with your care information today.
        </p>
      </header>

      <div>
        <h2 className="font-heading text-xl font-bold text-mediq-navy mb-4 px-1">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard 
            title="Add Observation" 
            description="Record a new voice or text note"
            icon={Activity} 
            to="/dashboard/observations" 
            color="text-mediq-blue" 
            bg="bg-mediq-blue/10" 
          />
          <ActionCard 
            title="View Patients" 
            description="Manage your assigned patients"
            icon={Users} 
            to="/dashboard/patients" 
            color="text-emerald-600" 
            bg="bg-emerald-500/10" 
          />
          <ActionCard 
            title="Handovers" 
            description="Review recent shift handovers"
            icon={ClipboardList} 
            to="/dashboard/handovers" 
            color="text-amber-600" 
            bg="bg-amber-500/10" 
          />
          <ActionCard 
            title="Check Guidance" 
            description="Search clinical protocols"
            icon={Stethoscope} 
            to="/dashboard/guidance" 
            color="text-#1A5CFF" 
            bg="bg-#1A5CFF/10" 
          />
        </div>
      </div>

      <div>
        <h2 className="font-heading text-xl font-bold text-mediq-navy mb-4 px-1">Recent Activity</h2>
        <div className="bg-white rounded-[24px] border border-dashed border-border p-12 text-center shadow-sm">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-[16px] bg-mediq-bg-blueTint text-mediq-blue mb-4">
            <Activity className="w-8 h-8" />
          </div>
          <h3 className="font-heading text-lg font-semibold text-mediq-navy mb-2">No recent observations</h3>
          <p className="text-mediq-slate text-sm max-w-sm mx-auto">
            You don't have any recent activity. Create a new observation to get started.
          </p>
          <Link 
            to="/dashboard/observations"
            className="mt-6 inline-flex bg-white border border-border text-mediq-navy px-5 py-2.5 rounded-full text-sm font-medium hover:bg-secondary transition-colors shadow-sm"
          >
            Create Observation
          </Link>
        </div>
      </div>
    </div>
  );
}

interface ActionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  color: string;
  bg: string;
}

function ActionCard({ title, description, icon: Icon, to, color, bg }: ActionCardProps) {
  return (
    <Link 
      to={to}
      className="group bg-white rounded-[20px] border border-border p-6 shadow-sm hover:shadow-md hover:border-mediq-blue/30 hover:-translate-y-1 transition-all duration-300 flex flex-col h-full"
    >
      <div className={cn("w-12 h-12 rounded-[14px] flex items-center justify-center mb-4 transition-colors", bg, color)}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="font-heading font-semibold text-mediq-navy mb-1 group-hover:text-mediq-blue transition-colors">{title}</h3>
      <p className="text-sm text-mediq-slate flex-1">{description}</p>
      
      <div className="mt-4 flex items-center text-xs font-medium text-mediq-blue opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
        Get started <ChevronRight className="w-3 h-3 ml-1" />
      </div>
    </Link>
  );
}
