// src/components/survey/Question.tsx
import React from 'react'
import { Question as QuestionType } from '@/types'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface QuestionProps {
  question: QuestionType
  value: string | string[] | number
  onChange: (value: string | string[] | number) => void
}

const Question: React.FC<QuestionProps> = ({ question, value, onChange }) => {
  return (
    <Card className="mb-4">
      <CardContent className="pt-6">
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {question.question_text}
            {question.required && <span className="text-red-500 ml-1">*</span>}
          </h3>
        </div>

        {question.question_type === 'text' && (
          <Textarea
            placeholder="Enter your answer"
            value={value as string}
            onChange={(e) => onChange(e.target.value)}
            className="w-full"
            required={question.required}
          />
        )}

        {question.question_type === 'multiple_choice' && question.options && (
          <RadioGroup
            value={value as string}
            onValueChange={onChange}
          >
            <div className="space-y-2">
              {question.options.map((option, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${question.id}-option-${idx}`} />
                  <Label htmlFor={`${question.id}-option-${idx}`}>{option}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        )}

        {question.question_type === 'rating' && (
          <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map((rating) => (
              <Button
                key={rating}
                type="button"
                size="icon"
                variant={parseInt(value as string) >= rating ? "default" : "outline"}
                onClick={() => onChange(rating)}
              >
                <Star className={parseInt(value as string) >= rating ? "fill-current" : ""} />
              </Button>
            ))}
          </div>
        )}

        {question.question_type === 'yes_no' && (
          <RadioGroup
            value={value as string}
            onValueChange={onChange}
          >
            <div className="flex space-x-6">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="Yes" id={`${question.id}-yes`} />
                <Label htmlFor={`${question.id}-yes`}>Yes</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="No" id={`${question.id}-no`} />
                <Label htmlFor={`${question.id}-no`}>No</Label>
              </div>
            </div>
          </RadioGroup>
        )}
      </CardContent>
    </Card>
  )
}

export default Question