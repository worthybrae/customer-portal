// src/components/survey/SurveyForm.tsx
import React, { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Survey, Question } from '@/types'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import QuestionComponent from './Question'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'

interface SurveyFormProps {
  survey: Survey
  questions: Question[]
}

const SurveyForm: React.FC<SurveyFormProps> = ({ survey, questions }) => {
  const navigate = useNavigate()
  const [answers, setAnswers] = useState<{ [key: string]: string | string[] | number }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Initialize answers with empty values
  React.useEffect(() => {
    const initialAnswers: { [key: string]: string | string[] | number } = {}
    questions.forEach(q => {
      if (q.question_type === 'text' || q.question_type === 'yes_no') {
        initialAnswers[q.id] = ''
      } else if (q.question_type === 'multiple_choice') {
        initialAnswers[q.id] = ''
      } else if (q.question_type === 'rating') {
        initialAnswers[q.id] = 0
      }
    })
    setAnswers(initialAnswers)
  }, [questions])

  const handleAnswerChange = (questionId: string, value: string | string[] | number) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value
    }))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // Validate required questions
      const unansweredRequired = questions
        .filter(q => q.required)
        .filter(q => {
          const answer = answers[q.id]
          return !answer || (typeof answer === 'string' && answer.trim() === '') || answer === 0
        })

      if (unansweredRequired.length > 0) {
        toast.error('Please answer all required questions')
        setIsSubmitting(false)
        return
      }

      // Create a new response
      const { data: responseData, error: responseError } = await supabase
        .from('responses')
        .insert({
          survey_id: survey.id,
          respondent_id: crypto.randomUUID()
        })
        .select()

      if (responseError) throw responseError

      if (responseData && responseData.length > 0) {
        const responseId = responseData[0].id

        // Create answers
        const answersToInsert = Object.entries(answers).map(([questionId, value]) => {
          if (typeof value === 'string' || Array.isArray(value)) {
            return {
              response_id: responseId,
              question_id: questionId,
              answer_text: value
            }
          } else {
            return {
              response_id: responseId,
              question_id: questionId,
              answer_value: value
            }
          }
        })

        const { error: answerError } = await supabase
          .from('answers')
          .insert(answersToInsert)

        if (answerError) throw answerError
        toast.success('Your response has been submitted')
        navigate('/thank-you')
      }
    } catch (error) {
      console.error('Error submitting survey:', error)
      
      toast.error('There was a problem submitting your response')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{survey.title}</CardTitle>
          {survey.description && (
            <CardDescription>{survey.description}</CardDescription>
          )}
        </CardHeader>
      </Card>

      {questions.map(question => (
        <QuestionComponent
          key={question.id}
          question={question}
          value={answers[question.id] || (question.question_type === 'rating' ? 0 : '')}
          onChange={(value) => handleAnswerChange(question.id, value)}
        />
      ))}

      <div className="mt-6 flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </Button>
      </div>
    </form>
  )
}

export default SurveyForm