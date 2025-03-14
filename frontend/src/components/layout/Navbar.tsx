// src/components/layout/Navbar.tsx
import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from "@/components/ui/button"
import { useSession } from '@/components/auth/AuthWrapper'
import { signOut } from '@/services/authService'

const Navbar: React.FC = () => {
  const session = useSession()
  const navigate = useNavigate()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="bg-white border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-2xl font-bold text-primary">
                Enigma Data
              </Link>
            </div>
            <div className="ml-6 flex space-x-8">
              {session && (
                <>
                  <Link
                    to="/company"
                    className="border-transparent text-gray-500 hover:border-primary hover:text-primary inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                  >
                    Outreach
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="ml-6 flex items-center">
            {session ? (
              <div className="flex items-center gap-4">
                <span className="hidden sm:flex text-sm text-gray-600">
                  {session.user?.user_metadata?.full_name || session.user?.email}
                </span>
                <Button variant="outline" onClick={handleSignOut}>Sign Out</Button>
              </div>
            ) : (
              <Button variant="default" onClick={() => navigate('/login')}>Sign In</Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar