// src/components/layout/Layout.tsx
import React, { ReactNode } from 'react'
import Navbar from './Navbar'
import { Toaster } from 'sonner'

interface LayoutProps {
  children: ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} SurveyPortal. All rights reserved.
          </p>
        </div>
      </footer>
      <Toaster position="top-right" />
    </div>
  )
}

export default Layout