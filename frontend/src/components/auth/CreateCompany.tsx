// pages/create-company.tsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createCompany } from '@/lib/supabase';

// Import shadcn components
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';

type LocationState = {
  email: string;
  domain: string;
};

export default function CreateCompany() {
  const navigate = useNavigate();
  const location = useLocation();
  const { email, domain } = (location.state as LocationState) || {};
  
  const [companyName, setCompanyName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [privacyPolicy, setPrivacyPolicy] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // If no domain was passed, redirect back to landing page
  if (!domain) {
    navigate('/');
    return null;
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!companyName) {
      setError('Company name is required');
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create the company
      await createCompany({
        name: companyName,
        domain,
        logo_url: logoUrl || undefined,
        banner_url: bannerUrl || undefined,
        privacy_policy: privacyPolicy || undefined
      });
      
      // Redirect back to landing page with the email pre-filled for sign up
      navigate('/', { 
        state: { 
          email,
          companyCreated: true 
        } 
      });
    } catch (error: any) {
      console.error('Error creating company:', error);
      setError(error.message || 'Error creating company. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Simple header with only the logo */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          {/* Logo */}
          <div className="font-bold text-xl">enigma</div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Create Company for {domain}</h1>
          <p className="text-gray-600 mb-8">
            We don't have {domain} in our system yet. Let's create your company profile.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Form Card */}
            <Card className="w-full shadow-lg border-0">
              <CardContent className="p-6">
                {error && (
                  <Alert className="mb-4 bg-red-50 text-red-700 border border-red-200">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="company-name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Acme Inc."
                      required
                      className="w-full border border-gray-300 p-2 rounded-md"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="privacy-policy">Privacy Policy URL</Label>
                    <Input
                      id="privacy-policy"
                      value={privacyPolicy}
                      onChange={(e) => setPrivacyPolicy(e.target.value)}
                      placeholder="https://example.com/privacy"
                      className="w-full border border-gray-300 p-2 rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="logo-url">Logo URL</Label>
                    <Input
                      id="logo-url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full border border-gray-300 p-2 rounded-md"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="banner-url">Banner URL</Label>
                    <Input
                      id="banner-url"
                      value={bannerUrl}
                      onChange={(e) => setBannerUrl(e.target.value)}
                      placeholder="https://example.com/banner.png"
                      className="w-full border border-gray-300 p-2 rounded-md"
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 pt-4">
                    <Button 
                      type="submit" 
                      className="w-full bg-slate-900 text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Creating Company...' : 'Create Company'}
                    </Button>
                    <Button 
                      type="button"
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate('/')}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
            
            {/* Preview Card */}
            <Card className="w-full shadow-lg border-0">
              <CardContent className="p-6">
                <h2 className="text-lg font-medium mb-4">Company Preview</h2>
                
                {/* Banner Preview */}
                <div className="w-full h-32 bg-gray-100 rounded-md overflow-hidden mb-4">
                  {bannerUrl ? (
                    <img 
                      src={bannerUrl} 
                      alt="Company Banner Preview" 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/400/128'; 
                        target.alt = 'Banner image not found';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <span className="text-gray-500">No Banner Image</span>
                    </div>
                  )}
                </div>
                
                {/* Company Info Preview */}
                <div className="flex items-center gap-4 py-4 border-b mb-4">
                  {/* Logo */}
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100 flex items-center justify-center">
                    {logoUrl ? (
                      <img 
                        src={logoUrl} 
                        alt="Company Logo Preview" 
                        className="h-full w-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = '/api/placeholder/64/64'; 
                          target.alt = 'Logo image not found';
                        }}
                      />
                    ) : (
                      <span className="text-lg font-medium text-gray-500">
                        {companyName ? companyName.charAt(0).toUpperCase() : '?'}
                      </span>
                    )}
                  </div>
                  
                  {/* Company Name */}
                  <div>
                    <h3 className="text-lg font-medium">
                      {companyName || 'Your Company Name'}
                    </h3>
                    <p className="text-sm text-gray-500">{domain}</p>
                  </div>
                </div>
                
                {/* Privacy Policy Preview */}
                <div className="text-center text-sm text-gray-500">
                  {privacyPolicy ? (
                    <p>
                      By responding, you agree to the{' '}
                      <a 
                        href={privacyPolicy}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline"
                      >
                        Privacy Policy
                      </a>
                    </p>
                  ) : (
                    <p>Privacy Policy URL not provided</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}