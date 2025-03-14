// src/components/auth/AuthWrapper.tsx
import { useState, useEffect, createContext, useContext } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Session } from '@supabase/supabase-js';

interface AuthWrapperProps {
  children: React.ReactNode;
}

export const SessionContext = createContext<Session | null>(null);

export function useSession() {
  const session = useContext(SessionContext);
  return session;
}

export function AuthWrapper({ children }: AuthWrapperProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  // Check for existing session on mount and setup auth listener
  useEffect(() => {
    // Set up a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Auth check timed out, forcing completion');
        setIsLoading(false);
      }
    }, 3000); // 3 seconds timeout

    // Get initial session
    const initializeAuth = async () => {
      try {
        // Check for existing session (this should retrieve from localStorage if present)
        const { data } = await supabase.auth.getSession();
        
        if (data.session) {
          console.log('Found existing session');
          setSession(data.session);
        } else {
          console.log('No session found');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
        setInitialCheckDone(true);
        clearTimeout(loadingTimeout); // Clear timeout if auth check completes normally
      }
    };

    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      console.log('Auth state changed:', _event);
      setSession(newSession);
      
      if (!initialCheckDone) {
        setIsLoading(false);
        setInitialCheckDone(true);
      }
    });

    // Clean up on unmount
    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  }, [initialCheckDone]);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        {/* Add a brief loading message */}
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  return (
    <SessionContext.Provider value={session}>
      {children}
    </SessionContext.Provider>
  );
}