// pages/dashboard.tsx (updated)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Company } from '../types';
import { getEmailDomain } from '../lib/utils';

// Import shadcn components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { ClipboardList } from 'lucide-react'; // Import ClipboardList icon

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, signOut, loading } = useAuth();
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If auth is still loading, wait
    if (loading) return;

    // If no user is logged in, redirect to sign in
    if (!user) {
      navigate('/auth/signin');
      return;
    }

    // Fetch company data if user is logged in
    const fetchCompanyData = async () => {
      try {
        const domain = getEmailDomain(user.email || '');
        
        if (!domain) return;
        
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('domain', domain)
          .single();
        
        if (error && error.code !== 'PGSQL_ERROR_NO_DATA_FOUND') {
          console.error('Error fetching company data:', error);
        }
        
        setCompany(data);
      } catch (error) {
        console.error('Error in fetch company data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (loading || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Button onClick={handleSignOut}>Sign Out</Button>
      </div>

      <div className="grid gap-6">
        {/* User Card */}
        <Card>
          <CardHeader>
            <CardTitle>Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={`https://ui-avatars.com/api/?name=${user?.email?.charAt(0)}&background=random`} alt="Avatar" />
              <AvatarFallback>{user?.email?.charAt(0)?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-lg font-medium">{user?.email}</p>
              <p className="text-sm text-gray-500">
                {company ? 'Work Account' : 'Personal Account'}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Company Card (only if work account) */}
        {company && (
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>Details about your organization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={`${company.name} logo`} 
                    className="h-16 w-16 object-contain"
                  />
                ) : (
                  <div className="h-16 w-16 bg-gray-100 flex items-center justify-center rounded-md">
                    <span className="text-lg font-medium text-gray-500">
                      {company.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-medium">{company.name}</h3>
                  <p className="text-sm text-gray-500">{company.domain}</p>
                </div>
              </div>

              {company.banner_url && (
                <div className="mt-4">
                  <img 
                    src={company.banner_url} 
                    alt={`${company.name} banner`} 
                    className="w-full h-32 object-cover rounded-md"
                  />
                </div>
              )}

              {company.privacy_policy && (
                <div className="mt-4">
                  <a 
                    href={company.privacy_policy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-500 hover:underline"
                  >
                    View Privacy Policy
                  </a>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Quick Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Access frequently used features
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Surveys Card */}
            <Card className="border border-dashed hover:border-solid hover:bg-slate-50 transition-all cursor-pointer"
                  onClick={() => navigate('/surveys')}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className="bg-primary/10 p-3 rounded-full">
                  <ClipboardList className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">Surveys</h3>
                  <p className="text-sm text-muted-foreground">Create and manage surveys</p>
                </div>
              </CardContent>
            </Card>
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}