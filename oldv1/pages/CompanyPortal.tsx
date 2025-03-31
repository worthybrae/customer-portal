// src/pages/CompanyPortal.tsx
import React from 'react'
import CompanyDashboard from '@/components/company/CompanyDashboard'
import { Toaster } from 'sonner'
import { useProtectedSession } from '@/hooks/useSession'

const CompanyPortal: React.FC = () => {
  // Ensure the user is authenticated
  useProtectedSession()

  return (
    <div>
      <CompanyDashboard />
      <Toaster />
    </div>
  )
}

export default CompanyPortal