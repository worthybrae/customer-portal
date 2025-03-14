// src/pages/SurveyView.tsx
import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Survey, Question } from '@/types'
import SurveyForm from '@/components/survey/SurveyForm'
import { Toaster, toast } from 'sonner'
import { Building } from 'lucide-react'

// Extend Survey type to include company info when fetched
interface SurveyWithCompany extends Survey {
  company?: {
    name: string;
    logo_url?: string;
  }
}

const SurveyView: React.FC = () => {
  const { surveyId } = useParams<{ surveyId: string }>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [survey, setSurvey] = useState<SurveyWithCompany | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  
  useEffect(() => {
    const fetchSurvey = async () => {
      if (!surveyId) {
        navigate('/')
        return
      }
      
      try {
        setLoading(true)
        
        // Fetch survey details with company information
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select(`
            *,
            company:company_id (
              name,
              logo_url
            )
          `)
          .eq('id', surveyId)
          .single()
        
        if (surveyError) throw surveyError
        
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('order', { ascending: true })
        
        if (questionsError) throw questionsError
        
        setSurvey(surveyData)
        setQuestions(questionsData)
      } catch (error) {
        console.error('Error fetching survey:', error)
        toast.error('Failed to load survey')
        navigate('/')
      } finally {
        setLoading(false)
      }
    }
    
    fetchSurvey()
  }, [surveyId, navigate])
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading survey...</p>
      </div>
    )
  }
  
  if (!survey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Survey Not Found</h2>
        <p className="mt-2 text-gray-600">The survey you're looking for doesn't exist or has been removed.</p>
      </div>
    )
  }
  
  if (!survey.is_published) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Survey Not Available</h2>
        <p className="mt-2 text-gray-600">This survey is currently in draft mode and not available for responses.</p>
      </div>
    )
  }
  
  return (
    <div className="max-w-3xl mx-auto">
      {/* Company branding header */}
      {survey.company && (
        <div className="mb-6 flex items-center border-b pb-4">
          <div className="mr-3">
            {survey.company.logo_url ? (
              <img 
                src={survey.company.logo_url} 
                alt={`${survey.company.name} logo`}
                className="w-12 h-12 object-contain rounded-md"
              />
            ) : (
              <div className="w-12 h-12 bg-gray-100 rounded-md flex items-center justify-center">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Outreach by</p>
            <h3 className="font-medium">{survey.company.name}</h3>
          </div>
        </div>
      )}
      
      <SurveyForm 
        survey={survey}
        questions={questions}
      />
      <Toaster />
    </div>
  )
}

export default SurveyView