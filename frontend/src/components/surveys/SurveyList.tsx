// components/surveys/SurveyList.tsx (updated)
import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { fetchUserSurveysWithQuestions, fetchCompanySurveysWithQuestions } from '../../lib/supabase';
import { Survey } from '../../types';
import { useNavigate } from 'react-router-dom';

// Import shadcn components
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '../../hooks/use-toast';

// Import icons
import { CalendarIcon, Edit, Trash2, Share2, ClipboardList, BarChart3 } from 'lucide-react';

type SurveyListProps = {
  companyId?: string;
  onCreateClick: () => void;
  onEditClick: (survey: Survey) => void;
  onViewClick: (survey: Survey) => void;
  onDeleteClick: (survey: Survey) => void;
};

export default function SurveyList({ 
  companyId, 
  onCreateClick, 
  onEditClick, 
  onDeleteClick 
}: SurveyListProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSurveys = async () => {
      setIsLoading(true);
      try {
        let data: Survey[];
        
        if (companyId) {
          data = await fetchCompanySurveysWithQuestions(companyId);
        } else {
          data = await fetchUserSurveysWithQuestions();
        }
        
        setSurveys(data);
      } catch (error) {
        console.error('Error fetching surveys:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      fetchSurveys();
    }
  }, [user, companyId]);

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Count questions in a survey
  const countQuestions = (survey: Survey) => {
    return survey.questions?.length || 0;
  };

  // Copy share link to clipboard
  const handleShareClick = (survey: Survey) => {
    const shareUrl = `${window.location.origin}/survey/${survey.id}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link copied!",
      description: "Survey link has been copied to clipboard",
    });
  };


  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-16 w-full" />
            </CardContent>
            <CardFooter>
              <Skeleton className="h-8 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Your Surveys</h2>
        <Button onClick={onCreateClick}>Create Survey</Button>
      </div>

      {surveys.length === 0 ? (
        <Card className="bg-muted/50">
          <CardContent className="pt-6 flex flex-col items-center justify-center min-h-[200px] text-center">
            <h3 className="text-lg font-medium mb-2">No surveys yet</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first survey to start collecting responses.
            </p>
            <Button onClick={onCreateClick}>Create Survey</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {surveys.map((survey) => (
            <Card key={survey.id} className="flex flex-col h-full">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="line-clamp-1">{survey.title}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEditClick(survey)}>
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive" 
                      onClick={() => onDeleteClick(survey)}
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </div>
                <CardDescription className="line-clamp-2">
                  {survey.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground mb-2">
                  <CalendarIcon className="mr-1 h-4 w-4" />
                  <span>Created {formatDate(survey.created_at)}</span>
                </div>
                
                {/* Questions count */}
                <div className="flex items-center text-sm text-muted-foreground">
                  <ClipboardList className="mr-1 h-4 w-4" />
                  <span>{countQuestions(survey)} questions</span>
                </div>
              </CardContent>
              <CardFooter className="border-t pt-4 pb-4">
                <div className="flex justify-between items-center w-full">
                  <Badge variant={survey.is_published ? "default" : "outline"}>
                    {survey.is_published ? "Published" : "Draft"}
                  </Badge>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => navigate(`/surveys/${survey.id}/stats`)}
                    >
                      <BarChart3 className="h-4 w-4" />
                      Statistics
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-8 gap-1"
                      onClick={() => handleShareClick(survey)}
                    >
                      <Share2 className="h-4 w-4" />
                      Share
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}