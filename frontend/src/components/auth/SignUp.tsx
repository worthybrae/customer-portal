// AuthContext.ts with email verification enforcement
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, resendVerificationEmail, updateUserEmail } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';
import { Company } from '@/types';
import { getEmailDomain } from '@/lib/utils';

// Updated context type with company
interface AuthContextData {
  user: User | null;
  company: Company | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
  isEmailVerified: boolean;
}

// Update initial state
const initialState: AuthContextData = {
  user: null,
  company: null,
  loading: true,
  signIn: async () => {},
  signUp: async () => ({ user: null }),
  signOut: async () => {},
  resendVerification: async () => {},
  updateEmail: async () => {},
  isEmailVerified: false,
};

export const AuthContext = createContext<AuthContextData>(initialState);

export function AuthProvider(props: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    user: User | null;
    company: Company | null;
    loading: boolean;
    isEmailVerified: boolean;
  }>({
    user: null,
    company: null,
    loading: true,
    isEmailVerified: false,
  });

  // Fetch company data when user changes
  useEffect(() => {
    if (!state.user) return;

    async function fetchCompanyData() {
      try {
        const domain = getEmailDomain(state.user?.email || '');
        
        if (!domain) return;
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('domain', domain)
          .single();
        
        if (error && error.code !== 'PGSQL_ERROR_NO_DATA_FOUND') {
          console.error('Error fetching company data:', error);
        }
        
        setState(prev => ({ ...prev, company: data }));
      } catch (error) {
        console.error('Error in fetch company data:', error);
      }
    }

    fetchCompanyData();
  }, [state.user]);

  useEffect(() => {
    // Check active sessions and set the user
    async function getInitialSession() {
        setState(prev => ({ ...prev, loading: true }));
        
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const currentUser = session?.user;
          
          setState({
            user: currentUser || null,
            company: null, // Company will be fetched in the other useEffect
            loading: false,
            isEmailVerified: currentUser?.email_confirmed_at ? true : false,
          });
        } catch (error) {
          console.error('Error getting session:', error);
          setState(prev => ({ ...prev, loading: false }));
        }
      }

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const currentUser = session?.user;
        setState(prev => ({
          ...prev,
          user: currentUser || null,
          loading: false,
          isEmailVerified: currentUser?.email_confirmed_at ? true : false,
        }));
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Set email verified status based on email_confirmed_at
      const isVerified = data.user?.email_confirmed_at ? true : false;
      
      setState(prev => ({ 
        ...prev, 
        user: data.user || null,
        isEmailVerified: isVerified,
      }));
      
      // If email is not verified, throw an error
      if (!isVerified) {
        // Sign out immediately since email isn't verified
        await supabase.auth.signOut();
        throw new Error('Please verify your email before signing in.');
      }
      
    } catch (error) {
      console.error('Error signing in:', error);
      throw error;
    }
  }

  async function signUp(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`, // Redirect directly to dashboard after verification
        }
      });
      
      if (error) throw error;
      
      // Always set isEmailVerified based on email_confirmed_at
      const isVerified = data.user?.email_confirmed_at ? true : false;
      
      setState(prev => ({ 
        ...prev, 
        user: data.user || null,
        isEmailVerified: isVerified,
      }));
      
      return { user: data.user };
    } catch (error) {
      console.error('Error signing up:', error);
      throw error;
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState(prev => ({ ...prev, user: null, company: null, isEmailVerified: false }));
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  }

  async function resendVerification(email: string) {
    try {
      await resendVerificationEmail(email);
    } catch (error) {
      console.error('Error resending verification:', error);
      throw error;
    }
  }

  async function updateEmail(newEmail: string) {
    try {
      const result = await updateUserEmail(newEmail);
      
      setState(prev => ({ 
        ...prev, 
        user: result,
        isEmailVerified: false, // Reset verification status as new email needs verification
      }));
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  // Create the value object
  const contextValue: AuthContextData = {
    user: state.user,
    company: state.company,
    loading: state.loading,
    signIn,
    signUp,
    signOut,
    resendVerification,
    updateEmail,
    isEmailVerified: state.isEmailVerified,
  };

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    props.children
  );
}

export function useAuth() {
  return useContext(AuthContext);
}