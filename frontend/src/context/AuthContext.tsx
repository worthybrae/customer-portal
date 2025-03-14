// src/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

interface User {
  id: string
  email: string
  email_confirmed_at?: string
  user_metadata: {
    full_name?: string
  }
}

interface Company {
  id: string
  name: string
  domain: string
  logo_url?: string
}

interface AuthContextType {
  user: User | null
  userCompany: Company | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, fullName: string) => Promise<void>
  signOut: () => Promise<void>
  createCompany: (name: string, domain: string, logoUrl?: string) => Promise<void>
  loading: boolean
  sessionChecked: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [userCompany, setUserCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Initialize on mount - check for existing session
  useEffect(() => {
    const checkSession = async () => {
      try {
        // Get current session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user as User)
          
          // Try to fetch company
          try {
            const { data: userCompanyData } = await supabase
              .from('user_companies')
              .select('company_id')
              .eq('user_id', session.user.id)
              .single()
            
            if (userCompanyData) {
              const { data: company } = await supabase
                .from('companies')
                .select('*')
                .eq('id', userCompanyData.company_id)
                .single()
              
              if (company) {
                setUserCompany(company as Company)
              }
            }
          } catch (error) {
            // Ignore company fetching errors
            console.error('Error fetching company:', error)
          }
        } else {
          setUser(null)
          setUserCompany(null)
        }
      } catch (error) {
        console.error('Error checking session:', error)
        setUser(null)
        setUserCompany(null)
      } finally {
        setSessionChecked(true)
        setLoading(false)
      }
    }
    
    checkSession()
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user as User)
        
        // Try to fetch company
        try {
          const { data: userCompanyData } = await supabase
            .from('user_companies')
            .select('company_id')
            .eq('user_id', session.user.id)
            .single()
          
          if (userCompanyData) {
            const { data: company } = await supabase
              .from('companies')
              .select('*')
              .eq('id', userCompanyData.company_id)
              .single()
            
            if (company) {
              setUserCompany(company as Company)
            }
          }
        } catch (error) {
          // Ignore company fetching errors
          console.error('Error fetching company:', error)
        } finally {
          setLoading(false)
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null)
        setUserCompany(null)
        setLoading(false)
      } else if (event === 'USER_UPDATED' && session?.user) {
        setUser(session.user as User)
      }
    })
    
    // Clean up subscription on unmount
    return () => {
      subscription.unsubscribe()
    }
  }, [])
  
  // Sign in with email and password
  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      if (data.user) {
        setUser(data.user as User)
        
        // Try to fetch company
        try {
          const { data: userCompanyData } = await supabase
            .from('user_companies')
            .select('company_id')
            .eq('user_id', data.user.id)
            .single()
          
          if (userCompanyData) {
            const { data: company } = await supabase
              .from('companies')
              .select('*')
              .eq('id', userCompanyData.company_id)
              .single()
            
            if (company) {
              setUserCompany(company as Company)
            }
          }
        } catch (companyError) {
          // Don't throw an error if company fetching fails
          console.error('Error fetching company:', companyError)
        }
        
        toast.success('Signed in successfully')
      }
    } catch (error: any) {
      console.error('Error signing in:', error)
      let errorMessage = 'Failed to sign in'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please try again.'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Please verify your email before signing in.'
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  // Sign up with email and password - simplified to focus on basics
  const signUp = async (email: string, password: string, fullName: string) => {
    try {
      setLoading(true)
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })
      
      if (error) throw error
      
      if (data.user) {
        // Just show success message - don't try to do company stuff yet
        toast.success('Account created! Please check your email to verify your account.')
      }
    } catch (error: any) {
      console.error('Error signing up:', error)
      
      let errorMessage = 'Failed to sign up'
      if (error.message.includes('already registered')) {
        errorMessage = 'This email is already registered. Please sign in or reset your password.'
      }
      
      toast.error(errorMessage)
      throw error
    } finally {
      setLoading(false)
    }
  }
  
  // Sign out - simplified to ensure it works
  const signOut = async () => {
    try {
      setLoading(true)
      
      // Call Supabase signOut
      await supabase.auth.signOut()
      
      // Clear state
      setUser(null)
      setUserCompany(null)
      
      toast.success('Signed out successfully')
      
      // Reload the page to ensure clean state
      window.location.href = '/'
    } catch (error: any) {
      console.error('Error signing out:', error)
      toast.error('Failed to sign out')
      
      // Force cleaning state even if API fails
      setUser(null)
      setUserCompany(null)
      window.location.href = '/'
    } finally {
      setLoading(false)
    }
  }
  
  // Create a new company - simplified
  const createCompany = async (name: string, domain: string, logoUrl?: string) => {
    if (!user) {
      toast.error('You must be logged in to create a company')
      return
    }
    
    try {
      setLoading(true)
      
      // Create the company
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert({
          name,
          domain,
          logo_url: logoUrl,
          is_personal: false
        })
        .select()
      
      if (companyError) throw companyError
      
      if (companyData && companyData.length > 0) {
        // Associate user with company as owner
        const { error: userCompanyError } = await supabase
          .from('user_companies')
          .insert({
            user_id: user.id,
            company_id: companyData[0].id,
            role: 'owner'
          })
        
        if (userCompanyError) throw userCompanyError
        
        setUserCompany(companyData[0] as Company)
        toast.success('Company created successfully')
      }
    } catch (error: any) {
      console.error('Error creating company:', error)
      toast.error(error.message || 'Failed to create company')
    } finally {
      setLoading(false)
    }
  }
  
  const value = {
    user,
    userCompany,
    signIn,
    signUp,
    signOut,
    createCompany,
    loading,
    sessionChecked
  }
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}