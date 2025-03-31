// pages/published-survey.tsx (Updated)
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchPublishedSurvey } from '../lib/supabase';
import { Survey, Company } from '../types';
import SurveyResponse from '../components/surveys/SurveyResponse';

// Import shadcn components
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function PublishedSurvey() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) return;
      
      try {
        setIsLoading(true);
        const data = await fetchPublishedSurvey(surveyId);
        
        if (!data) {
          setError('Survey not found or not published');
          return;
        }
        
        setSurvey(data.survey);
        setCompany(data.company);
      } catch (err) {
        console.error('Error fetching survey:', err);
        setError('Could not load survey');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSurvey();
  }, [surveyId]);

  const handleSubmissionSuccess = () => {
    setHasSubmitted(true);
    toast({
      title: "Response Submitted",
      description: "Thank you for completing the survey!",
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Card className="w-full">
          <CardHeader className="flex justify-center items-center py-12">
            <LoadingSpinner size="lg" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !survey) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Card className="w-full text-center py-8">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">
              {error || 'Survey not found'}
            </h2>
            <p className="text-muted-foreground mb-4">
              The survey you're looking for may not exist or is no longer available.
            </p>
            <Button onClick={() => navigate('/')}>Go Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show completed message if submitted
  if (hasSubmitted) {
    return (
      <div className="container mx-auto max-w-3xl p-4">
        <Card className="w-full text-center py-8">
          <CardContent className="space-y-4">
            <h2 className="text-xl font-semibold">Response Submitted</h2>
            <p className="text-muted-foreground">
              You have completed this survey. Thank you for your participation!
            </p>
            {company && (
              <div className="flex items-center justify-center gap-2 mt-4">
                {company.logo_url && (
                  <img
                    src={company.logo_url}
                    alt={`${company.name} logo`}
                    className="h-8 w-8 object-contain"
                  />
                )}
                <span className="text-sm font-medium">{company.name}</span>
              </div>
            )}
            <Button className="mt-4" onClick={() => navigate('/')}>Back to Home</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show survey content
  return (
    <div className="container mx-auto max-w-3xl p-4">
      <Card className="w-full">
        {/* Company Banner */}
        {company?.banner_url && (
          <div className="h-32 overflow-hidden">
            <img 
              src={company.banner_url} 
              alt={`${company.name} banner`} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <CardHeader className="pb-2">
          <div className="flex items-center gap-3 mb-2">
            {/* Company Logo */}
            {company && (
              <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
                {company.logo_url ? (
                  <img 
                    src={company.logo_url} 
                    alt={`${company.name} logo`} 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <span className="text-sm font-medium text-gray-500">
                    {company.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex-1">
              <h1 className="text-xl font-bold">{survey.title}</h1>
              <div className="flex items-center gap-2">
                {company && <span className="text-sm text-muted-foreground">{company.name}</span>}
                <Badge>Published</Badge>
              </div>
            </div>
          </div>
          
          {survey.description && (
            <p className="text-sm text-muted-foreground">{survey.description}</p>
          )}
        </CardHeader>
        
        <CardContent>
          <SurveyResponse 
            survey={survey}
            onSubmitSuccess={handleSubmissionSuccess}
          />
        </CardContent>
        
        <CardFooter className="border-t pt-4">
          {company?.privacy_policy ? (
            <p className="text-xs text-muted-foreground">
              By responding, you agree to the{' '}
              <a 
                href={company.privacy_policy}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
              >
                Privacy Policy
              </a>
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              {company?.name || 'Survey'} | Published Survey
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}