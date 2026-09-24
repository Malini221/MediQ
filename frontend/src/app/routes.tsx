import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../components/ProtectedRoute';
import DashboardLayout from '../layouts/DashboardLayout';
import { Overview } from '../pages/Overview';
import { Patients } from '../pages/Patients';
import { PatientDetail } from '../pages/PatientDetail';
import { NewObservation } from '../pages/NewObservation';
import { ObservationDetail } from '../pages/ObservationDetail';
import { AuthPage } from '../pages/AuthPage';
import { PatientAuthPage } from '../pages/PatientAuthPage';
import { LandingPage } from '../pages/LandingPage';
import { Handovers } from '../pages/Handovers';
import { HandoverDetail } from '../pages/HandoverDetail';
import { ClinicalGuidance } from '../pages/ClinicalGuidance';
import { CaregiverSupport } from '../pages/CaregiverSupport';
import { PublicRoute } from '../components/PublicRoute';
import { ClinicianDashboard } from '../pages/Clinician/ClinicianDashboard';
import { CoordinatorDashboard } from '../pages/Coordinator/CoordinatorDashboard';
import { FamilyDashboard } from '../pages/Family/FamilyDashboard';
import { ProfessionalDashboard } from '../pages/Professional/ProfessionalDashboard';
import { Observations } from '../pages/Observations';
import { Settings } from '../pages/Settings';
import { Notifications } from '../pages/Notifications';
import { PatientDashboard } from '../pages/PatientDashboard';
import { PatientReports } from '../pages/PatientReports';
import { RouteErrorBoundary } from '../components/RouteErrorBoundary';

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorBoundary />,
    element: <PublicRoute />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: '/auth/caregiver', element: <AuthPage initialMode="signin" /> },
      { path: '/auth/patient', element: <PatientAuthPage initialMode="signin" /> },
    ]
  },
  {
    errorElement: <RouteErrorBoundary />,
    element: <ProtectedRoute />,
    children: [
      {
        path: '/dashboard',
        element: <DashboardLayout />,
        children: [
          {
            index: true,
            element: <Navigate to="/dashboard/overview" replace />,
          },
          {
            path: 'overview',
            element: <Overview />,
          },
          {
            path: 'patients',
            element: <Patients />,
          },
          {
            path: 'patients/:patientId',
            element: <PatientDetail />,
          },
          {
            path: 'patients/:patientId/observations/new',
            element: <NewObservation />,
          },
          { path: 'observations', element: <Observations /> },
          { path: 'observations/new', element: <NewObservation /> },
          {
            path: 'observations/:observationId',
            element: <ObservationDetail />,
          },
          { path: 'handovers', element: <Handovers /> },
          { path: 'handovers/:handoverId', element: <HandoverDetail /> },
          { path: 'guidance', element: <ClinicalGuidance /> },
          { path: 'support', element: <CaregiverSupport /> },
          { path: 'settings', element: <Settings /> },
          { path: 'patient', element: <PatientDashboard /> },
          { path: 'reports', element: <PatientReports /> },
          { path: 'notifications', element: <Notifications /> },
          { path: 'clinician', element: <ClinicianDashboard /> },
          { path: 'coordinator', element: <CoordinatorDashboard /> },
          { path: 'family', element: <FamilyDashboard /> },
          { path: 'professional', element: <ProfessionalDashboard /> },
          { path: '*', element: <RouteErrorBoundary /> },
        ]
      }
    ]
  }
]);
