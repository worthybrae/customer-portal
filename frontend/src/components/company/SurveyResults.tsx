// src/components/company/SurveyResults.tsx
import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Survey, Question, Response, Answer } from '@/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { Download, ArrowLeft } from 'lucide-react'
import { useUser } from '@/components/auth/UserProvider'

interface SurveyResultsData {
  survey: Survey | null
  questions: Question[]
  responses: Response[]
  answers: Answer[]
}

interface SurveyResultsProps {
  surveyId: string
}

const SurveyResults: React.FC<SurveyResultsProps> = ({ surveyId }) => {
  const navigate = useNavigate()
  const { userCompany } = useUser()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<SurveyResultsData>({
    survey: null,
    questions: [],
    responses: [],
    answers: []
  })
  
  useEffect(() => {
    const fetchResults = async () => {
      if (!surveyId || !userCompany) return
      
      try {
        setLoading(true)
        
        // Fetch survey details
        const { data: surveyData, error: surveyError } = await supabase
          .from('surveys')
          .select('*')
          .eq('id', surveyId)
          .eq('company_id', userCompany.id) // Ensure only company owners can view results
          .single()
        
        if (surveyError) throw surveyError
        
        // Fetch questions
        const { data: questionsData, error: questionsError } = await supabase
          .from('questions')
          .select('*')
          .eq('survey_id', surveyId)
          .order('order', { ascending: true })
        
        if (questionsError) throw questionsError
        
        // Fetch responses
        const { data: responsesData, error: responsesError } = await supabase
          .from('responses')
          .select('*')
          .eq('survey_id', surveyId)
        
        if (responsesError) throw responsesError
        
        // Fetch answers
        const { data: answersData, error: answersError } = await supabase
          .from('answers')
          .select('*')
          .in('response_id', responsesData.map(r => r.id))
        
        if (answersError) throw answersError
        
        setData({
          survey: surveyData,
          questions: questionsData,
          responses: responsesData,
          answers: answersData
        })
      } catch (error) {
        console.error('Error fetching survey results:', error)
        toast.error('Failed to load survey results')
        navigate('/company')
      } finally {
        setLoading(false)
      }
    }
    
    fetchResults()
  }, [surveyId, navigate, userCompany])
  
  const downloadCSV = () => {
    if (!data.survey || data.responses.length === 0) return
    
    try {
      const csvRows = []
      
      // Headers
      const headers = ['Response ID', 'Submission Date', ...data.questions.map(q => q.question_text)]
      csvRows.push(headers.join(','))
      
      // Data rows
      data.responses.forEach(response => {
        const row = [
          response.id,
          new Date(response.created_at).toLocaleString(),
        ]
        
        // Add answer for each question
        data.questions.forEach(question => {
          const answer = data.answers.find(a => 
            a.response_id === response.id && a.question_id === question.id
          )
          
          if (answer) {
            if (answer.answer_text) {
              // Escape commas in the text
              row.push(`"${answer.answer_text.replace(/"/g, '""')}"`)
            } else if (answer.answer_value) {
              row.push(`"${JSON.stringify(answer.answer_value).replace(/"/g, '""')}"`)
            } else {
              row.push('')
            }
          } else {
            row.push('')
          }
        })
        
        csvRows.push(row.join(','))
      })
      
      // Create and download CSV
      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute('download', `${data.survey.title}_results.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
      console.error('Error generating CSV:', error)
      toast.error('Failed to download results')
    }
  }
  
  const getQuestionResults = (question: Question) => {
    const questionAnswers = data.answers.filter(a => a.question_id === question.id)
    
    if (question.question_type === 'multiple_choice') {
      const options = question.options || []
      const counts: Record<string, number> = {}
      
      options.forEach(option => {
        counts[option] = 0
      })
      
      questionAnswers.forEach(answer => {
        const value = answer.answer_text || answer.answer_value
        if (value && typeof value === 'string' && counts[value] !== undefined) {
          counts[value]++
        }
      })
      
      return (
        <div className="mt-2">
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(counts).map(([option, count]) => (
              <div key={option} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>{option}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }
    
    if (question.question_type === 'yes_no') {
      const yesCount = questionAnswers.filter(a => a.answer_text === 'Yes').length
      const noCount = questionAnswers.filter(a => a.answer_text === 'No').length
      
      return (
        <div className="mt-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>Yes</span>
              <span className="font-medium">{yesCount}</span>
            </div>
            <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>No</span>
              <span className="font-medium">{noCount}</span>
            </div>
          </div>
        </div>
      )
    }
    
    if (question.question_type === 'rating') {
      const ratings = questionAnswers.map(a => {
        const value = a.answer_value
        return typeof value === 'number' ? value : 0
      })
      
      const average = ratings.length > 0 
        ? ratings.reduce((sum, val) => sum + val, 0) / ratings.length 
        : 0
      
      return (
        <div className="mt-2">
          <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
            <span>Average rating</span>
            <span className="font-medium">{average.toFixed(1)} / 5</span>
          </div>
        </div>
      )
    }
    
    // Text responses
    return (
      <div className="mt-2">
        <p className="text-sm text-gray-500 mb-1">Responses:</p>
        {questionAnswers.length === 0 ? (
          <p className="text-sm italic">No responses yet</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {questionAnswers.map((answer, idx) => (
              <div key={idx} className="text-sm p-2 bg-gray-50 rounded">
                {answer.answer_text || JSON.stringify(answer.answer_value)}
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <p>Loading results...</p>
      </div>
    )
  }
  
  if (!data.survey) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Survey Not Found</h2>
        <p className="mt-2 text-gray-600">The survey you're looking for doesn't exist or has been removed.</p>
        <Button 
          onClick={() => navigate('/company')}
          className="mt-4"
        >
          Back to Dashboard
        </Button>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/company')}
            className="mr-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{data.survey.title} - Results</h1>
        </div>
        <Button 
          onClick={downloadCSV}
          disabled={data.responses.length === 0}
        >
          <Download className="mr-2 h-4 w-4" />
          Download CSV
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Survey created on {new Date(data.survey.created_at).toLocaleDateString()}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Total Responses</p>
              <p className="text-3xl font-bold">{data.responses.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Questions</p>
              <p className="text-3xl font-bold">{data.questions.length}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-xl font-medium">
                {data.survey.is_published ? 'Published' : 'Draft'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {data.responses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">No responses yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Share your survey to collect responses.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Question Results</h2>
          
          {data.questions.map(question => (
            <Card key={question.id}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{question.question_text}</CardTitle>
                <CardDescription>
                  {question.question_type === 'text' ? 'Text responses' : 
                   question.question_type === 'multiple_choice' ? 'Choice distribution' : 
                   question.question_type === 'rating' ? 'Rating average' : 
                   'Yes/No distribution'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {getQuestionResults(question)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default SurveyResults