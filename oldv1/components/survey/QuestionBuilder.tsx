// src/components/survey/QuestionBuilder.tsx
import React, { useState } from 'react'
import { QuestionFormData, QuestionType } from '@/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Plus, X } from 'lucide-react'

interface QuestionBuilderProps {
  questions: QuestionFormData[]
  setQuestions: React.Dispatch<React.SetStateAction<QuestionFormData[]>>
}

const QuestionBuilder: React.FC<QuestionBuilderProps> = ({ questions, setQuestions }) => {
  const [newQuestion, setNewQuestion] = useState<QuestionFormData>({
    question_text: '',
    question_type: 'text',
    required: false
  })
  
  const handleAddQuestion = () => {
    if (newQuestion.question_text.trim() === '') return
    
    setQuestions([...questions, { ...newQuestion }])
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      required: false
    })
  }
  
  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }
  
  const handleQuestionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewQuestion({
      ...newQuestion,
      question_text: e.target.value
    })
  }
  
  const handleTypeChange = (value: string) => {
    const type = value as QuestionType
    setNewQuestion({
      ...newQuestion,
      question_type: type,
      options: type === 'multiple_choice' ? [''] : undefined
    })
  }
  
  const handleRequiredChange = (checked: boolean) => {
    setNewQuestion({
      ...newQuestion,
      required: checked
    })
  }
  
  const handleAddOption = () => {
    if (!newQuestion.options) return
    
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, '']
    })
  }
  
  const handleOptionChange = (index: number, value: string) => {
    if (!newQuestion.options) return
    
    const updatedOptions = [...newQuestion.options]
    updatedOptions[index] = value
    
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions
    })
  }
  
  const handleRemoveOption = (index: number) => {
    if (!newQuestion.options) return
    
    setNewQuestion({
      ...newQuestion,
      options: newQuestion.options.filter((_, i) => i !== index)
    })
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add a Question</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="question_text">Question</Label>
            <Input
              id="question_text"
              value={newQuestion.question_text}
              onChange={handleQuestionChange}
              placeholder="Enter your question"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="question_type">Question Type</Label>
            <Select
              value={newQuestion.question_type}
              onValueChange={handleTypeChange}
            >
              <SelectTrigger id="question_type">
                <SelectValue placeholder="Select question type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="yes_no">Yes/No</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {newQuestion.question_type === 'multiple_choice' && newQuestion.options && (
            <div className="space-y-3">
              <Label>Options</Label>
              {newQuestion.options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddOption}
                className="mt-2"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Option
              </Button>
            </div>
          )}
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={newQuestion.required}
              onCheckedChange={handleRequiredChange}
            />
            <Label htmlFor="required">Required</Label>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAddQuestion}>Add Question</Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Questions</h3>
        {questions.length === 0 ? (
          <p className="text-sm text-gray-500">No questions added yet.</p>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <Card key={index}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{question.question_text}</p>
                      <div className="flex items-center mt-1 space-x-2">
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                          {question.question_type}
                        </span>
                        {question.required && (
                          <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                            Required
                          </span>
                        )}
                      </div>
                      
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="mt-2">
                          <p className="text-sm text-gray-500 mb-1">Options:</p>
                          <ul className="list-disc list-inside text-sm">
                            {question.options.map((option, optionIndex) => (
                              <li key={optionIndex}>{option || `Option ${optionIndex + 1}`}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveQuestion(index)}
                    >
                      Remove
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default QuestionBuilder