// src/pages/AuthCallback.tsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const AuthCallback = () => {
  const [error, setError] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Process the hash URL ourselves for better control
        const hashParams = new URLSearchParams(window.location.hash.substring(1))
        const accessToken = hashParams.get('access_token')
        const refreshToken = hashParams.get('refresh_token')
        const type = hashParams.get('type')
        
        if (type === 'recovery') {
          // Handle password reset flow
          navigate('/reset-password')
          return
        }

        if (type === 'signup' || type === 'magiclink') {
          // Check for error parameter
          const errorParam = hashParams.get('error')
          const errorDescription = hashParams.get('error_description')
          
          if (errorParam) {
            setError(errorDescription || 'An error occurred during authentication')
            return
          }
          
          // Exchange tokens if present
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            })
            
            if (error) throw error
            
            // Redirect to login with a verified flag
            navigate('/login?verified=true')
            return
          }
        }
        
        // Default fallback if nothing else matched
        navigate('/login')
      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Authentication failed')
      }
    }

    handleAuthCallback()
  }, [navigate])

  // Display a loading state or error
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <div className="text-xl font-semibold text-red-600">Authentication Error</div>
        <p className="mt-2 text-gray-600">{error}</p>
        <button 
          onClick={() => navigate('/login')}
          className="mt-4 px-4 py-2 bg-primary text-white rounded-md"
        >
          Return to Login
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <div className="text-xl font-semibold">Verifying your account...</div>
      <div className="mt-4 w-8 h-8 border-t-2 border-primary rounded-full animate-spin"></div>
    </div>
  )
}

export default AuthCallback