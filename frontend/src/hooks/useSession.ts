// src/hooks/useSession.ts
import { useContext, useEffect } from 'react';
import { SessionContext } from '@/components/auth/AuthWrapper';
import { useNavigate } from 'react-router-dom';

export function useProtectedSession() {
  const session = useContext(SessionContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!session) {
      navigate('/login', { replace: true });
    }
  }, [session, navigate]);

  return session;
}

export function usePublicSession() {
  const session = useContext(SessionContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/company', { replace: true });
    }
  }, [session, navigate]);

  return session;
}

export function useUser() {
  const session = useContext(SessionContext);
  return session?.user || null;
}