// src/pages/CreateCompany.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { Building, Upload } from 'lucide-react'
import { useUser } from '@/components/auth/UserProvider'
import { createCompany } from '@/services/companyService'
import { supabase } from '@/lib/supabase'
import { useProtectedSession } from '@/hooks/useSession'

const CreateCompany: React.FC = () => {
  // This hook ensures the user is logged in
  const session = useProtectedSession()
  const { userCompany, refreshUserCompany, loading: userLoading } = useUser()
  const navigate = useNavigate()
  
  const [companyName, setCompanyName] = useState('')
  const [companyDomain, setCompanyDomain] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // If user already has a company, redirect to dashboard
  useEffect(() => {
    if (userCompany) {
      navigate('/company')
    }
  }, [userCompany, navigate])
  
  // Pre-fill domain from user's email if available
  useEffect(() => {
    if (session?.user?.email && !companyDomain) {
      const domain = session.user.email.split('@')[1]
      if (domain && domain !== 'gmail.com' && domain !== 'yahoo.com' && domain !== 'hotmail.com') {
        setCompanyDomain(domain)
      }
    }
  }, [session, companyDomain])
  
  // Handle logo file selection
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setLogoFile(file)
      
      // Create a preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }
  
  // Handle company creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!companyName.trim()) {
      toast.error('Please enter a company name')
      return
    }
    
    if (!companyDomain.trim()) {
      toast.error('Please enter a company domain')
      return
    }
    
    if (!session?.user?.id) {
      toast.error('Authentication error')
      return
    }
    
    try {
      setIsUploading(true)
      
      let logoUrl = null
      
      // Upload logo if provided
      if (logoFile) {
        const filename = `company-logos/${Date.now()}-${logoFile.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('public')
          .upload(filename, logoFile)
        
        if (uploadError) throw uploadError
        
        if (uploadData) {
          const { data: urlData } = supabase.storage
            .from('public')
            .getPublicUrl(filename)
          
          logoUrl = urlData.publicUrl
        }
      }
      
      // Create company
      const { error } = await createCompany({
        name: companyName,
        domain: companyDomain,
        logoUrl: logoUrl || undefined,
        userId: session.user.id
      })
      
      if (error) throw error
      
      // Refresh company data
      await refreshUserCompany()
      
      // Redirect to dashboard
      navigate('/company')
    } catch (error) {
      console.error('Error creating company:', error)
      toast.error('Failed to create company')
    } finally {
      setIsUploading(false)
    }
  }
  
  // Show loading state
  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-md mx-auto py-12">
      <Card>
        <CardHeader>
          <CardTitle>Create Your Company</CardTitle>
          <CardDescription>
            Set up your company profile to start creating surveys
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Enter your company name"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-domain">Company Domain</Label>
              <Input
                id="company-domain"
                value={companyDomain}
                onChange={(e) => setCompanyDomain(e.target.value)}
                placeholder="example.com"
                required
              />
              <p className="text-xs text-gray-500">
                This helps us connect colleagues to the same account
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company-logo">Company Logo (Optional)</Label>
              <div className="flex items-center gap-4">
                {logoPreview ? (
                  <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden">
                    <img 
                      src={logoPreview}
                      alt="Logo preview"
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-md bg-gray-100 flex items-center justify-center">
                    <Building className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <label
                    htmlFor="logo-upload"
                    className="flex items-center justify-center gap-2 w-full py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50"
                  >
                    <Upload className="h-4 w-4" />
                    <span className="text-sm">Select Logo</span>
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoChange}
                    />
                  </label>
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isUploading}
            >
              {isUploading ? 'Creating...' : 'Create Company'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default CreateCompany