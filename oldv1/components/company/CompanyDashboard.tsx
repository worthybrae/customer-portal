// src/components/company/CompanyDashboard.tsx
import React, { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Survey } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, Edit2, LineChart, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import SurveyResults from './SurveyResults'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useUser } from '@/components/auth/UserProvider'

const CompanyDashboard: React.FC = () => {
  const location = useLocation()
  const { userCompany, loading: userLoading } = useUser()
  const [surveys, setSurveys] = useState<Survey[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSurveyId, setActiveSurveyId] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)
  
  // Check if we're on the results page
  useEffect(() => {
    const match = location.pathname.match(/\/survey\/results\/(.+)/)
    if (match && match[1]) {
      setActiveSurveyId(match[1])
      setShowResults(true)
    } else {
      setShowResults(false)
    }
  }, [location])
  
  // Fetch surveys when userCompany is available
  useEffect(() => {
    const fetchSurveys = async () => {
      if (!userCompany) {
        if (!userLoading) {
          // Only set error if user loading is done and we still don't have userCompany
          setError('No company found. Please create a company first.')
        }
        return
      }
      
      try {
        setLoading(true)
        setError(null)
        
        const { data, error } = await supabase
          .from('surveys')
          .select('*')
          .eq('company_id', userCompany.id)
          .order('created_at', { ascending: false })
        
        if (error) throw error
        
        setSurveys(data || [])
      } catch (error: any) {
        console.error('Error fetching surveys:', error)
        setError('Failed to load surveys: ' + (error.message || 'Unknown error'))
        toast.error('Failed to load surveys')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSurveys()
  }, [userCompany, userLoading])
  
  const handleDeleteSurvey = async (surveyId: string) => {
    if (!window.confirm('Are you sure you want to delete this survey?')) return
    
    try {
      // Delete related questions first
      const { error: questionsError } = await supabase
        .from('questions')
        .delete()
        .eq('survey_id', surveyId)
      
      if (questionsError) throw questionsError
      
      // Delete the survey
      const { error: surveyError } = await supabase
        .from('surveys')
        .delete()
        .eq('id', surveyId)
      
      if (surveyError) throw surveyError
      
      // Update local state
      setSurveys(surveys.filter(s => s.id !== surveyId))
      toast.success('Survey deleted successfully')
    } catch (error: any) {
      console.error('Error deleting survey:', error)
      toast.error('Failed to delete survey: ' + (error.message || 'Unknown error'))
    }
  }

  const handlePublishSurvey = async (surveyId: string) => {
    try {
      const { error } = await supabase
        .from('surveys')
        .update({ is_published: true })
        .eq('id', surveyId)
      
      if (error) throw error
      
      // Update local state
      setSurveys(surveys.map(survey => 
        survey.id === surveyId ? { ...survey, is_published: true } : survey
      ))
      
      toast.success('Survey published successfully')
    } catch (error: any) {
      console.error('Error publishing survey:', error)
      toast.error('Failed to publish survey: ' + (error.message || 'Unknown error'))
    }
  }
  
  if (showResults && activeSurveyId) {
    return <SurveyResults surveyId={activeSurveyId} />
  }

  // Show loading state
  if (loading || userLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading outreaches...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="py-12">
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-lg font-medium text-red-500">{error}</p>
            {!userCompany && (
              <div className="mt-6">
                <Link to="/company/create">
                  <Button>
                    Create Your Company
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          {userCompany ? `${userCompany.name}` : 'Company Dashboard'}
        </h1>
        <Link to="/survey/editor">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Outreach
          </Button>
        </Link>
      </div>
      
      {surveys.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="text-lg font-medium">No outreaches yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Create your first outreach to get started
            </p>
            <div className="mt-6">
              <Link to="/survey/editor">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Outreach
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Outreaches</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
          </TabsList>
          
          <TabsContent value="all">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map(survey => (
                <SurveyCard 
                  key={survey.id} 
                  survey={survey} 
                  onDelete={handleDeleteSurvey} 
                  onPublish={handlePublishSurvey}
                />
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="published">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.filter(s => s.is_published).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p>No published outreaches yet</p>
                  </CardContent>
                </Card>
              ) : (
                surveys
                  .filter(s => s.is_published)
                  .map(survey => (
                    <SurveyCard 
                      key={survey.id} 
                      survey={survey} 
                      onDelete={handleDeleteSurvey} 
                      onPublish={handlePublishSurvey}
                    />
                  ))
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="drafts">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.filter(s => !s.is_published).length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center">
                    <p>No draft outreaches</p>
                  </CardContent>
                </Card>
              ) : (
                surveys
                  .filter(s => !s.is_published)
                  .map(survey => (
                    <SurveyCard 
                      key={survey.id} 
                      survey={survey} 
                      onDelete={handleDeleteSurvey} 
                      onPublish={handlePublishSurvey}
                    />
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}

// Extract SurveyCard into its own component for better organization
interface SurveyCardProps {
  survey: Survey
  onDelete: (id: string) => void
  onPublish: (id: string) => void
}

const SurveyCard: React.FC<SurveyCardProps> = ({ survey, onDelete, onPublish }) => {
  const navigate = useNavigate()
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-start">
          <span className="truncate">{survey.title}</span>
          <span className={`text-xs px-2 py-1 rounded-full ${
            survey.is_published ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
          }`}>
            {survey.is_published ? 'Published' : 'Draft'}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
          {survey.description || 'No description provided'}
        </p>
        <p className="text-xs text-gray-400 mb-4">
          Created: {new Date(survey.created_at).toLocaleDateString()}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/survey/editor/${survey.id}`)}
          >
            <Edit2 className="mr-1 h-3 w-3" /> Edit
          </Button>
          
          {survey.is_published ? (
            <>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate(`/survey/results/${survey.id}`)}
              >
                <LineChart className="mr-1 h-3 w-3" /> Results
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  const url = `${window.location.origin}/survey/${survey.id}`;
                  navigator.clipboard.writeText(url);
                  toast.success('Survey link copied to clipboard');
                }}
              >
                <ExternalLink className="mr-1 h-3 w-3" /> Share
              </Button>
            </>
          ) : (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onPublish(survey.id)}
            >
              Publish
            </Button>
          )}
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => onDelete(survey.id)}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="mr-1 h-3 w-3" /> Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default CompanyDashboard