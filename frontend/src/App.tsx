// src/App.tsx
import React from 'react'
import { Outlet } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import { Toaster } from 'sonner'
import { AuthWrapper } from '@/components/auth/AuthWrapper'
import { UserProvider } from '@/components/auth/UserProvider'

const App: React.FC = () => {
  return (
    <AuthWrapper>
      <UserProvider>
        <Layout>
          <Outlet />
        </Layout>
        <Toaster position="top-right" />
      </UserProvider>
    </AuthWrapper>
  )
}

export default App