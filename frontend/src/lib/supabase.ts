// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

// Default fallback values for local development
const DEFAULT_SUPABASE_URL = 'https://xyzcompany.supabase.co'
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' // Placeholder, will not work

// Use environment variables or fallback to defaults for development
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY

// Create the Supabase client with explicitly configured session persistence
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,  // Explicitly enable session persistence
    autoRefreshToken: true, // Auto-refresh the token before it expires
    storageKey: 'supabase.auth.token', // Use the standard storage key
    storage: localStorage, // Explicitly use localStorage for persistence
    detectSessionInUrl: true // Detect OAuth tokens in URL
  },
})

// Add a debug helper for checking session status
export const checkSessionStatus = async () => {
  try {
    const { data, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Session check error:', error)
      return null
    }
    return data.session
  } catch (e) {
    console.error('Error checking session:', e)
    return null
  }
}

// Helper function to handle Supabase errors gracefully
export const handleSupabaseError = (error: any, fallbackMessage = 'An error occurred') => {
  console.error('Supabase error:', error)
  
  // Extract the most helpful error message
  const errorMessage = error?.message || 
                       error?.error_description || 
                       error?.details || 
                       fallbackMessage
  
  return errorMessage
}