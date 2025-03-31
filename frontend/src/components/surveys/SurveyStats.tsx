// components/surveys/SurveyStats.tsx
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { fetchSurveyWithQuestions, fetchSurveyResponses, getSurveyStatistics } from '../../lib/supabase';
import { Survey, SurveyQuestion, SurveyAnswer } from '../../types';
import { format, parseISO, subDays, isAfter } from 'date-fns';

// Import shadcn components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useToast } from '../../hooks/use-toast';

// Import charts and icons
import { PieChart, Pie, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ArrowLeft, Calendar, UserRound, BarChart3, DownloadIcon, Clock } from 'lucide-react';

// Helper function to format dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

// Colors for charts
const CHART_COLORS = [
  '#0ea5e9', '#6366f1', '#8b5cf6', '#ec4899', '#f97316', 
  '#14b8a6', '#84cc16', '#06b6d4', '#f43f5e', '#10b981'
];

export default function SurveyStats() {
  const { surveyId } = useParams<{ surveyId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyAnswer[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch survey data, responses and stats
  useEffect(() => {
    const fetchData = async () => {
      if (!surveyId) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch survey with questions
        const surveyData = await fetchSurveyWithQuestions(surveyId);
        setSurvey(surveyData);
        
        // Fetch responses
        const responsesData = await fetchSurveyResponses(surveyId);
        setResponses(responsesData);
        
        // Fetch statistics
        const statsData = await getSurveyStatistics(surveyId);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching survey data:', err);
        setError('Failed to load survey statistics');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [surveyId]);
  
  // Generate response summary with daily data
  const getResponseSummary = () => {
    if (!survey || !stats || !responses) return null;
    
    const totalQuestions = survey.questions?.length || 0;
    
    // Calculate unique respondents by email
    const uniqueEmails = [...new Set(responses.map(r => r.email))];
    const totalResponses = uniqueEmails.length;
    
    // Calculate recent respondents (last 24 hours)
    const now = new Date();
    const oneDayAgo = subDays(now, 1);
    
    // Find emails that have submissions in the last 24 hours
    const recentRespondents = uniqueEmails.filter(email => {
      const latestResponse = responses
        .filter(r => r.email === email)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
      
      return latestResponse && isAfter(parseISO(latestResponse.created_at), oneDayAgo);
    });
    
    // Group responses by day for chart
    const responsesPerDay: Record<string, Set<string>> = {};
    
    responses.forEach(response => {
      const day = format(parseISO(response.created_at), 'yyyy-MM-dd');
      
      if (!responsesPerDay[day]) {
        responsesPerDay[day] = new Set();
      }
      
      responsesPerDay[day].add(response.email);
    });
    
    // Convert to array for chart
    const dailyResponseData = Object.entries(responsesPerDay)
      .map(([date, emails]) => ({
        date,
        count: emails.size,
        displayDate: format(parseISO(date), 'MMM d')
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    
    // Calculate response rate per question
    const questionResponseRates = survey.questions?.map(question => {
      const responseCount = stats.questionStats[question.id] || 0;
      const responseRate = totalResponses > 0 ? Math.round((responseCount / totalResponses) * 100) : 0;
      
      return {
        question: question.question_text,
        responses: responseCount,
        responseRate
      };
    });
    
    return {
      totalQuestions,
      totalResponses,
      recentResponses: recentRespondents.length,
      dailyResponseData,
      questionResponseRates
    };
  };
  
  // Process multiple choice question data for charts
  const processMultipleChoiceData = (question: SurveyQuestion) => {
    if (!question || !responses) return [];
    
    // Get all responses for this question
    const questionResponses = responses.filter(r => r.question_id === question.id);
    
    // For checkbox questions, we need to parse the answer_value which will be an array
    if (question.question_type === 'checkbox') {
      // Create a count for each option
      const optionCounts: {[key: string]: number} = {};
      
      // Initialize all options with 0
      (question.options || []).forEach(option => {
        optionCounts[option] = 0;
      });
      
      // Count each selected option
      questionResponses.forEach(response => {
        try {
          const selectedOptions = Array.isArray(response.answer_value) 
            ? response.answer_value 
            : JSON.parse(response.answer_value || '[]');
          
          selectedOptions.forEach((option: string) => {
            if (optionCounts[option] !== undefined) {
              optionCounts[option]++;
            }
          });
        } catch (e) {
          // Handle case where answer_value isn't properly formatted
          console.error('Error parsing checkbox response:', e);
        }
      });
      
      // Convert to chart data format
      return Object.entries(optionCounts).map(([name, value]) => ({ name, value }));
    } else {
      // For radio questions, count each answer
      const optionCounts: {[key: string]: number} = {};
      
      // Initialize all options with 0
      (question.options || []).forEach(option => {
        optionCounts[option] = 0;
      });
      
      // Count answers
      questionResponses.forEach(response => {
        const answer = response.answer_text || '';
        if (optionCounts[answer] !== undefined) {
          optionCounts[answer]++;
        }
      });
      
      // Convert to chart data format
      return Object.entries(optionCounts).map(([name, value]) => ({ name, value }));
    }
  };
  
  // Process text responses
  const getTextResponses = (question: SurveyQuestion) => {
    if (!question || !responses) return [];
    
    return responses
      .filter(r => r.question_id === question.id)
      .map(r => ({
        responseId: r.id,
        answer: r.answer_text,
        date: formatDate(r.created_at)
      }));
  };
  
  // Generate CSV for download
  const generateCSV = () => {
    if (!survey || !responses) return;
    
    try {
      // Create headers
      const headers = ['Respondent ID', 'Date'];
      const questions = survey.questions || [];
      
      // Add question text as headers
      questions.forEach(q => {
        headers.push(q.question_text);
      });
      
      // Group responses by respondent
      const respondentMap = new Map();
      
      responses.forEach(response => {
        if (!respondentMap.has(response.email)) {
          respondentMap.set(response.email, {
            email: response.email,
            date: formatDate(response.created_at),
            answers: {}
          });
        }
        
        // Add this answer to the respondent's answers, keyed by question ID
        respondentMap.get(response.email).answers[response.question_id] = response.answer_text;
      });
      
      // Convert to CSV rows
      const rows = [];
      rows.push(headers.join(','));
      
      // Add data rows
      respondentMap.forEach(respondent => {
        const row = [respondent.email, respondent.date];
        
        // Add answers in the same order as the questions
        questions.forEach(question => {
          const answer = respondent.answers[question.id] || '';
          // Escape commas and quotes for CSV
          row.push(`"${answer.replace(/"/g, '""')}"`);
        });
        
        rows.push(row.join(','));
      });
      
      // Create and download the CSV file
      const csvContent = rows.join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${survey.title}_responses.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Downloaded",
        description: "Survey responses have been downloaded as a CSV file.",
      });
    } catch (err) {
      console.error('Error generating CSV:', err);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to generate the CSV file. Please try again.",
      });
    }
  };
  
  const responseSummary = getResponseSummary();
  
  if (isLoading) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/surveys')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <Skeleton className="h-12 w-full mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  
  if (error || !survey) {
    return (
      <div className="container mx-auto p-4 max-w-6xl">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="outline" size="icon" onClick={() => navigate('/surveys')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">Survey Statistics</h1>
        </div>
        
        <Alert variant="destructive">
          <AlertDescription>
            {error || "Survey not found"}
          </AlertDescription>
        </Alert>
        
        <div className="mt-4">
          <Button onClick={() => navigate('/surveys')}>Return to Surveys</Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => navigate('/surveys')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{survey.title}</h1>
          <div className="flex items-center gap-2">
            <Badge variant={survey.is_published ? "default" : "outline"}>
              {survey.is_published ? "Published" : "Draft"}
            </Badge>
            <span className="text-sm text-muted-foreground">
              Created {formatDate(survey.created_at)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <UserRound className="h-10 w-10 text-primary mb-2" />
              <h2 className="text-3xl font-bold">{responseSummary?.totalResponses || 0}</h2>
              <p className="text-sm text-muted-foreground">Total Respondents</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <Clock className="h-10 w-10 text-blue-500 mb-2" />
              <h2 className="text-3xl font-bold">{responseSummary?.recentResponses || 0}</h2>
              <p className="text-sm text-muted-foreground">Past 24 Hours</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <BarChart3 className="h-10 w-10 text-primary mb-2" />
              <h2 className="text-3xl font-bold">{responseSummary?.totalQuestions || 0}</h2>
              <p className="text-sm text-muted-foreground">Questions</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center text-center">
              <Calendar className="h-10 w-10 text-primary mb-2" />
              <h2 className="text-3xl font-bold">
                {responses.length > 0 
                  ? formatDate(responses[0].created_at)
                  : 'N/A'}
              </h2>
              <p className="text-sm text-muted-foreground">Latest Response</p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Actions */}
      <div className="flex justify-end mb-6">
        <Button 
          variant="outline" 
          onClick={generateCSV}
          className="flex items-center gap-2"
        >
          <DownloadIcon className="h-4 w-4" />
          Export as CSV
        </Button>
      </div>
      
      {/* No responses message */}
      {responses.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="py-6 text-center">
            <h3 className="text-lg font-medium mb-2">No responses yet</h3>
            <p className="text-sm text-muted-foreground">
              There are no responses to this survey yet. Share your survey to collect responses.
            </p>
            <Button className="mt-4" onClick={() => navigate(`/surveys`)}>
              Back to Surveys
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="questions">Question Breakdown</TabsTrigger>
            <TabsTrigger value="individual">Individual Responses</TabsTrigger>
          </TabsList>
          
          {/* Overview Tab */}
          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Response Overview</CardTitle>
                <CardDescription>
                  Summary of all responses to your survey
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Daily Respondents Chart */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Respondents by Day</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={responseSummary?.dailyResponseData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="displayDate" 
                          tick={{ fontSize: 12 }}
                        />
                        <YAxis 
                          allowDecimals={false}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value} respondents`, 'Count']}
                          labelFormatter={(value) => `Date: ${value}`}
                        />
                        <Bar dataKey="count" name="Respondents" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                
                {/* Response rate chart */}
                <div className="mb-6">
                  <h3 className="text-lg font-medium mb-4">Response Rate by Question</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={responseSummary?.questionResponseRates}
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                      >
                        <XAxis type="number" domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                        <YAxis 
                          type="category" 
                          dataKey="question" 
                          width={150}
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => value.length > 30 ? `${value.substring(0, 30)}...` : value}
                        />
                        <Tooltip 
                          formatter={(value) => [`${value}%`, 'Response Rate']}
                          labelFormatter={(value) => `Question: ${value}`}
                        />
                        <Bar dataKey="responseRate" fill="#0ea5e9">
                          {
                            responseSummary?.questionResponseRates?.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                            ))
                          }
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Question Breakdown Tab */}
          <TabsContent value="questions">
            <div className="space-y-6">
              {survey.questions?.map((question, index) => (
                <Card key={question.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <CardDescription>{question.question_text}</CardDescription>
                      </div>
                      <Badge>{question.question_type}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* Multiple choice visualization */}
                    {['radio', 'checkbox'].includes(question.question_type) && (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={processMultipleChoiceData(question)}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                              >
                                {processMultipleChoiceData(question).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        
                        <div className="h-64">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                              data={processMultipleChoiceData(question)}
                              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                            >
                              <XAxis dataKey="name" />
                              <YAxis />
                              <Tooltip formatter={(value) => [`${value} responses`, 'Count']} />
                              <Bar dataKey="value" name="Responses" fill="#0ea5e9">
                                {processMultipleChoiceData(question).map((_, index) => (
                                  <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                    
                    {/* Text response visualization */}
                    {['text', 'textarea', 'date', 'number'].includes(question.question_type) && (
                      <div>
                        <h3 className="text-md font-medium mb-3">Latest Responses</h3>
                        <div className="space-y-2 max-h-64 overflow-y-auto p-1">
                          {getTextResponses(question).length > 0 ? (
                            getTextResponses(question).map((response, i) => (
                              <div key={i} className="p-3 bg-muted rounded-md">
                                <p className="text-sm">{response.answer}</p>
                                <p className="text-xs text-muted-foreground mt-1">{response.date}</p>
                              </div>
                            ))
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No responses yet</p>
                          )}
                        </div>
                        {question.question_type === 'number' && getTextResponses(question).length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <h3 className="text-md font-medium mb-3">Number Statistics</h3>
                            <div className="grid grid-cols-3 gap-4">
                              <div className="p-3 bg-muted rounded-md text-center">
                                <p className="text-xs text-muted-foreground">Average</p>
                                <p className="text-lg font-medium">
                                  {(getTextResponses(question)
                                    .map(r => parseFloat(r.answer))
                                    .filter(n => !isNaN(n))
                                    .reduce((sum, n, _, arr) => sum + n / arr.length, 0))
                                    .toFixed(2)}
                                </p>
                              </div>
                              <div className="p-3 bg-muted rounded-md text-center">
                                <p className="text-xs text-muted-foreground">Min</p>
                                <p className="text-lg font-medium">
                                  {Math.min(...getTextResponses(question)
                                    .map(r => parseFloat(r.answer))
                                    .filter(n => !isNaN(n)))}
                                </p>
                              </div>
                              <div className="p-3 bg-muted rounded-md text-center">
                                <p className="text-xs text-muted-foreground">Max</p>
                                <p className="text-lg font-medium">
                                  {Math.max(...getTextResponses(question)
                                    .map(r => parseFloat(r.answer))
                                    .filter(n => !isNaN(n)))}
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <p className="text-sm text-muted-foreground">
                      {stats?.questionStats[question.id] || 0} responses ({responseSummary?.totalResponses ? Math.round(((stats?.questionStats[question.id] || 0) / responseSummary.totalResponses) * 100) : 0}% response rate)
                    </p>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </TabsContent>
          
          {/* Individual Responses Tab */}
          <TabsContent value="individual">
            <Card>
              <CardHeader>
                <CardTitle>Individual Responses</CardTitle>
                <CardDescription>
                  View all individual survey responses
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Group responses by respondent */}
                {(() => {
                  // Create a map of respondents and their answers
                  const respondentMap = new Map();
                  
                  responses.forEach(response => {
                    if (!respondentMap.has(response.email)) {
                      respondentMap.set(response.email, {
                        id: response.email,
                        date: formatDate(response.created_at),
                        answers: {}
                      });
                    }
                    
                    // Find the question text
                    const question = survey.questions?.find(q => q.id === response.question_id);
                    if (question) {
                      respondentMap.get(response.email).answers[question.id] = {
                        questionText: question.question_text,
                        questionType: question.question_type,
                        answerText: response.answer_text,
                        answerValue: response.answer_value
                      };
                    }
                  });
                  
                  // Convert to array and sort by date (newest first)
                  const respondents = Array.from(respondentMap.values())
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                  
                  return (
                    <div className="space-y-6">
                      {respondents.map((respondent, index) => (
                        <Card key={index}>
                          <CardHeader className="pb-2">
                            <div className="flex justify-between items-center">
                              <CardTitle className="text-md">Response #{index + 1}</CardTitle>
                              <Badge variant="outline">{respondent.date}</Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {survey.questions?.map(question => (
                                <div key={question.id} className="border-b pb-3 last:border-0">
                                  <p className="text-sm font-medium">{question.question_text}</p>
                                  {respondent.answers[question.id] ? (
                                    <p className="mt-1">
                                      {respondent.answers[question.id].answerText}
                                    </p>
                                  ) : (
                                    <p className="text-sm text-muted-foreground italic">
                                      No answer provided
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}