// src/pages/SurveyEditor.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SurveyFormData, QuestionFormData } from '@/types'
import CreateSurvey from '@/components/company/CreateSurvey'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Toaster, toast } from 'sonner'
import { useUser } from '@/components/auth/UserProvider'

const SurveyEditor: React.FC = () => {
  // Ensure the user is authenticated using the new hook
  const { userCompany } = useUser()
  
  const { surveyId } = useParams<{ surveyId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [surveyData, setSurveyData] = useState<SurveyFormData | null>(null)
  
  useEffect(() => {
    // If user doesn't have a company, redirect to company creation
    if (!userCompany && !loading) {
      navigate('/company/create')
    }
  }, [userCompany, navigate, loading])
  
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId || !userCompany) {
        setLoading(false)
        return
      }
      
      try {
        setLoading(true)
        
        // Fetch survey details
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .eq('company_id', userCompany.id) // Ensure only company owners can edit
          .single()
        
        if (surveyError) throw surveyError
        
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('order', { ascending: true })
        
        if (questionsError) throw questionsError
        
        // Transform questions to match our form structure
        const formattedQuestions: QuestionFormData[] = questionsData.map(q => ({
          question_text: q.question_text,
          question_type: q.question_type,
          options: q.options,
          required: q.required,
        }))
        
        setSurveyData({
          title: surveyData.title,
          description: surveyData.description || '',
          questions: formattedQuestions,
        })
      } catch (error) {
        console.error('Error fetching survey:', error)
        toast.error('Failed to load survey')
        navigate('/company')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSurvey()
  }, [surveyId, navigate, userCompany])
  
  if (loading && surveyId) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading survey...</p>
      </div>
    )
  }
  
  return (
    <div>
      <div className="flex items-center mb-6">
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => navigate('/company')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">
          {surveyId ? 'Edit Survey' : 'Create New Survey'}
        </h1>
      </div>
      
      <CreateSurvey 
        initialData={surveyData || undefined}
        surveyId={surveyId}
        isEditing={!!surveyId}
      />
      
      <Toaster />
    </div>
  )
}

export default SurveyEditor