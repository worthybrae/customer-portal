// src/components/auth/ProtectedRoute.tsx
import React, { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from './AuthWrapper';

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  redirectTo = '/login' 
}) => {
  const session = useSession();
  
  // If we don't have a session, redirect to login
  if (!session) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: ReactNode;
  redirectTo?: string;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/company' 
}) => {
  const session = useSession();
  
  // If we have a session, redirect to dashboard
  if (session) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};