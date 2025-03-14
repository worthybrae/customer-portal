// src/components/company/CreateSurvey.tsx
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { SurveyFormData, QuestionFormData } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import QuestionBuilder from '@/components/survey/QuestionBuilder'
import { toast } from 'sonner'
import { Save, Globe, AlertCircle } from 'lucide-react'
import { useUser } from '@/components/auth/UserProvider'
import { useSession } from '@/components/auth/AuthWrapper'

interface CreateSurveyProps {
  initialData?: SurveyFormData
  surveyId?: string
  isEditing?: boolean
}

const CreateSurvey: React.FC<CreateSurveyProps> = ({ 
  initialData, 
  surveyId, 
  isEditing = false 
}) => {
  const navigate = useNavigate()
  const session = useSession()
  const { userCompany } = useUser()
  
  const [formData, setFormData] = useState<SurveyFormData>(
    initialData || {
      title: '',
      description: '',
      questions: [],
    }
  )
  const [loading, setLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  
  // Redirect if no user or company
  useEffect(() => {
    if (!session) {
      toast.error('You must be logged in to create surveys')
      navigate('/login')
      return
    }
    
    if (!userCompany) {
      navigate('/company/create')
    }
  }, [session, userCompany, navigate])
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }
  
  const handleQuestions: React.Dispatch<React.SetStateAction<QuestionFormData[]>> = (questionsOrUpdater) => {
    setFormData(prev => {
      const newQuestions = typeof questionsOrUpdater === 'function' 
        ? questionsOrUpdater(prev.questions) 
        : questionsOrUpdater;
      
      return {
        ...prev,
        questions: newQuestions,
      };
    });
  };
  
  const handleSave = async (publish: boolean = false) => {
    if (!formData.title.trim()) {
      toast.error('Please enter a survey title')
      return
    }
    
    if (!userCompany?.id) {
      toast.error('Company information is missing')
      navigate('/company/create')
      return
    }
    
    try {
      setLoading(true)
      setSaveStatus('saving')
      
      if (isEditing && surveyId) {
        // Update existing survey
        const { error: surveyError } = await supabase
          .from('surveys')
          .update({
            title: formData.title,
            description: formData.description,
            is_published: publish,
            updated_at: new Date().toISOString(),
          })
          .eq('id', surveyId)
          .eq('company_id', userCompany.id) // Ensure user can only edit surveys for their company
        
        if (surveyError) throw surveyError
        
        // Delete existing questions and recreate them
        const { error: deleteError } = await supabase
          .from('questions')
          .delete()
          .eq('survey_id', surveyId)
        
        if (deleteError) throw deleteError
        
        // Insert new questions
        if (formData.questions.length > 0) {
          const { error: questionsError } = await supabase
            .from('questions')
            .insert(
              formData.questions.map((q, index) => ({
                survey_id: surveyId,
                question_text: q.question_text,
                question_type: q.question_type,
                options: q.options || [],
                required: q.required,
                order: index,
              }))
            )
          
          if (questionsError) throw questionsError
        }
        
        setSaveStatus('saved')
        toast.success(`Survey ${publish ? 'published' : 'saved'} successfully`)
        navigate('/company')
      } else {
        // Create new survey
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .insert({
            company_id: userCompany.id,
            title: formData.title,
            description: formData.description,
            is_published: publish,
          })
          .select()
        
        if (surveyError) throw surveyError
        
        if (surveyData && surveyData.length > 0) {
          const newSurveyId = surveyData[0].id
          
          // Insert questions
          if (formData.questions.length > 0) {
            const { error: questionsError } = await supabase
              .from('questions')
              .insert(
                formData.questions.map((q, index) => ({
                  survey_id: newSurveyId,
                  question_text: q.question_text,
                  question_type: q.question_type,
                  options: q.options || [],
                  required: q.required,
                  order: index,
                }))
              )
            
            if (questionsError) throw questionsError
          }
          
          setSaveStatus('saved')
          toast.success(`Survey ${publish ? 'published' : 'saved as draft'} successfully`)
          navigate('/company')
        }
      }
    } catch (error: any) {
      console.error('Error saving survey:', error)
      setSaveStatus('error')
      toast.error('Failed to save survey: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }
  
  // Don't render anything if user or company data is missing
  if (!session || !userCompany) {
    return (
      <div className="py-8 flex justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{isEditing ? 'Edit Survey' : 'Create New Survey'}</CardTitle>
          <CardDescription>
            Fill in the details below to {isEditing ? 'update your' : 'create a new'} survey for {userCompany.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium">
              Survey Title <span className="text-red-500">*</span>
            </label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter survey title"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter survey description"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
      
      <QuestionBuilder 
        questions={formData.questions}
        setQuestions={handleQuestions}
      />
      
      {saveStatus === 'error' && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            There was a problem saving your survey. Please try again.
          </AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-end space-x-4">
        <Button 
          variant="outline" 
          onClick={() => navigate('/company')}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          variant="secondary" 
          onClick={() => handleSave(false)}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" /> 
          {loading && saveStatus === 'saving' ? 'Saving...' : 'Save Draft'}
        </Button>
        <Button 
          onClick={() => handleSave(true)}
          disabled={loading}
        >
          <Globe className="mr-2 h-4 w-4" />
          {loading && saveStatus === 'saving' ? 'Publishing...' : 'Publish Survey'}
        </Button>
      </div>
    </div>
  )
}

export default CreateSurvey