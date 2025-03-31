// App.tsx (updated with landing page)
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Import pages and components
import LandingPage from './pages/landing-page';
import VerifyEmail from './pages/verify-email';
import CreateCompany from './components/auth/CreateCompany';
import Dashboard from './pages/dashboard';
import SurveysPage from './pages/surveys';
import PublishedSurvey from './pages/published-survey';
import SurveyStats from './components/surveys/SurveyStats';
import Navigation from './components/layout/Navigation';
import { Toaster } from './components/ui/toaster';

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  // Make sure to add a useEffect to handle navigation when user state changes
  useEffect(() => {
    if (!loading) {
      if (!user) {
        // No user, redirect to landing page
        navigate('/');
      } else if (!isEmailVerified) {
        // User exists but email not verified, redirect to landing page
        // The landing page will handle showing the verification UI
        navigate('/');
      }
    }
  }, [user, loading, isEmailVerified, navigate]);

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!user || !isEmailVerified) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();
  
  return (
    <>
      {user && <Navigation />}
      <div className={user ? "py-4" : ""}>
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" />} />
          
          {/* Auth routes */}
          <Route path="/auth/verify-email" element={<VerifyEmail />} />
          <Route path="/auth/create-company" element={<CreateCompany />} />
          
          {/* Protected routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          
          {/* Add surveys route */}
          <Route 
            path="/surveys" 
            element={
              <ProtectedRoute>
                <SurveysPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Add survey stats route */}
          <Route 
            path="/surveys/:surveyId/stats" 
            element={
              <ProtectedRoute>
                <SurveyStats />
              </ProtectedRoute>
            } 
          />
          
          {/* Public survey route */}
          <Route 
            path="/survey/:surveyId" 
            element={<PublishedSurvey />} 
          />
          
          {/* 404 route */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="min-h-screen bg-slate-50">
          <AppRoutes />
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}