// components/surveys/QuestionItem.tsx
import { SurveyQuestion, QuestionType } from '../../types';
import { GripVertical, Trash2 } from 'lucide-react';

// Import shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Card } from '../ui/card';

type QuestionItemProps = {
  question: SurveyQuestion;
  index: number;
  questionTypes: {label: string, value: QuestionType}[];
  updateQuestion: (index: number, field: string, value: any) => void;
  deleteQuestion: (index: number) => void;
  addQuestionOption: (questionIndex: number) => void;
  updateQuestionOption: (questionIndex: number, optionIndex: number, value: string) => void;
  deleteQuestionOption: (questionIndex: number, optionIndex: number) => void;
};

export default function QuestionItem({
  question,
  index,
  questionTypes,
  updateQuestion,
  deleteQuestion,
  addQuestionOption,
  updateQuestionOption,
  deleteQuestionOption
}: QuestionItemProps) {
  
  return (
    <Card className="border rounded-md p-3 bg-white">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Question {index + 1}</span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => deleteQuestion(index)}
          className="h-8 w-8 p-0"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          <span className="sr-only">Delete</span>
        </Button>
      </div>
      
      <div className="space-y-3">
        {/* Question Text */}
        <div className="space-y-2">
          <Label htmlFor={`question-${index}`}>
            Question Text <span className="text-red-500">*</span>
          </Label>
          <Input
            id={`question-${index}`}
            value={question.question_text}
            onChange={(e) => updateQuestion(index, 'question_text', e.target.value)}
            placeholder="Enter your question"
          />
        </div>
        
        {/* Question Type */}
        <div className="space-y-2">
          <Label htmlFor={`question-type-${index}`}>Question Type</Label>
          <select
            id={`question-type-${index}`}
            value={question.question_type}
            onChange={(e) => updateQuestion(index, 'question_type', e.target.value as QuestionType)}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            {questionTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Required Toggle */}
        <div className="flex items-center space-x-2">
          <Switch
            id={`question-required-${index}`}
            checked={question.required}
            onCheckedChange={(checked) => updateQuestion(index, 'required', checked)}
          />
          <Label htmlFor={`question-required-${index}`}>Required</Label>
        </div>
        
        {/* Options for Multiple Choice Questions */}
        {['radio', 'checkbox'].includes(question.question_type) && (
          <div className="space-y-2">
            <Label>Options <span className="text-red-500">*</span></Label>
            {(question.options || []).map((option, optionIndex) => (
              <div key={optionIndex} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateQuestionOption(index, optionIndex, e.target.value)}
                  placeholder={`Option ${optionIndex + 1}`}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestionOption(index, optionIndex)}
                  disabled={(question.options || []).length <= 1}
                  className="h-10 w-10 p-0"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => addQuestionOption(index)}
              className="mt-1"
            >
              Add Option
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}