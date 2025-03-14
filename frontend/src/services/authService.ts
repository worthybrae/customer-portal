// src/services/authService.ts
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface SignUpData {
  email: string;
  password: string;
  fullName: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export const signUp = async ({ email, password, fullName }: SignUpData) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;

    // Additional logic for company detection/creation will be handled elsewhere
    // to keep this service focused on auth only

    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing up:', error);
    
    let errorMessage = 'Failed to sign up';
    if (error.message.includes('already registered')) {
      errorMessage = 'This email is already registered. Please sign in or reset your password.';
    }
    
    toast.error(errorMessage);
    return { data: null, error };
  }
};

export const signIn = async ({ email, password }: SignInData) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    toast.success('Signed in successfully');
    return { data, error: null };
  } catch (error: any) {
    console.error('Error signing in:', error);
    
    let errorMessage = 'Failed to sign in';
    if (error.message.includes('Invalid login credentials')) {
      errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.message.includes('Email not confirmed')) {
      errorMessage = 'Please verify your email before signing in.';
    }
    
    toast.error(errorMessage);
    return { data: null, error };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    toast.success('Signed out successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Error signing out:', error);
    toast.error('Failed to sign out: ' + error.message);
    return { error };
  }
};

export const resetPassword = async (email: string) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    if (error) throw error;
    
    toast.success('Password reset email sent. Check your inbox.');
    return { error: null };
  } catch (error: any) {
    console.error('Error resetting password:', error);
    toast.error('Failed to send reset email: ' + error.message);
    return { error };
  }
};

export const updatePassword = async (newPassword: string) => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) throw error;
    
    toast.success('Password updated successfully');
    return { error: null };
  } catch (error: any) {
    console.error('Error updating password:', error);
    toast.error('Failed to update password: ' + error.message);
    return { error };
  }
};