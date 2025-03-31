// components/surveys/SurveyForm.tsx (enhanced)
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { createSurvey, updateSurvey } from '../../lib/supabase';
import { Survey, SurveyQuestion, QuestionType } from '../../types';
import SurveyPreview from './SurveyPreview';
import QuestionItem from './QuestionItem';
import { PlusCircle } from 'lucide-react';

// Import shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { Alert, AlertDescription } from '../ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";

type SurveyFormProps = {
  companyId: string;
  survey?: Survey;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (survey: Survey) => void;
};

export default function SurveyForm({ 
  companyId, 
  survey, 
  isOpen, 
  onClose, 
  onSuccess 
}: SurveyFormProps) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<SurveyQuestion[]>([]);
  
  // Question type options
  const questionTypes: {label: string, value: QuestionType}[] = [
    { label: 'Short Text', value: 'text' },
    { label: 'Long Text', value: 'textarea' },
    { label: 'Multiple Choice', value: 'radio' },
    { label: 'Checkboxes', value: 'checkbox' },
    { label: 'Number', value: 'number' },
    { label: 'Date', value: 'date' }
  ];

  // Set initial form values when editing an existing survey
  useEffect(() => {
    if (survey) {
      setTitle(survey.title);
      setDescription(survey.description || '');
      setIsPublished(survey.is_published);
      // Load questions if they exist
      if (survey.questions) {
        // Make sure questions are sorted by order
        const sortedQuestions = [...survey.questions].sort((a, b) => a.order - b.order);
        setQuestions(sortedQuestions);
      } else {
        setQuestions([]);
      }
    } else {
      // Reset form for new survey
      setTitle('');
      setDescription('');
      setIsPublished(false);
      setQuestions([]);
    }
  }, [survey, isOpen]);
  
  // Add a new question
  const addQuestion = () => {
    if (questions.length >= 5) {
      return; // Maximum 5 questions
    }
    
    const newQuestion: SurveyQuestion = {
      id: Date.now().toString(), // Temporary ID
      survey_id: survey?.id || '',
      question_text: '',
      question_type: 'text',
      required: false,
      options: [''],
      order: questions.length // Set order based on current position
    };
    
    setQuestions([...questions, newQuestion]);
  };
  
  // Update a question
  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = {
      ...updatedQuestions[index],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };
  
  // Add an option to a multiple choice question
  const addQuestionOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    updatedQuestions[questionIndex].options = [
      ...(updatedQuestions[questionIndex].options || ['']),
      ''
    ];
    setQuestions(updatedQuestions);
  };
  
  // Update a question option
  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) {
      updatedQuestions[questionIndex].options = [];
    }
    const options = [...updatedQuestions[questionIndex].options!];
    options[optionIndex] = value;
    updatedQuestions[questionIndex].options = options;
    setQuestions(updatedQuestions);
  };
  
  // Delete a question option
  const deleteQuestionOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    if (!updatedQuestions[questionIndex].options) return;
    
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options!.filter(
      (_, idx) => idx !== optionIndex
    );
    setQuestions(updatedQuestions);
  };
  
  // Delete a question
  const deleteQuestion = (index: number) => {
    const filteredQuestions = questions.filter((_, idx) => idx !== index);
    
    // Update order for remaining questions
    const updatedQuestions = filteredQuestions.map((q, idx) => ({
      ...q,
      order: idx
    }));
    
    setQuestions(updatedQuestions);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!user) {
      setError('You must be logged in to create a survey');
      return;
    }
    
    // Ensure we have a valid company ID
    if (!companyId) {
      setError('Company ID is required');
      return;
    }
    
    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (!questions[i].question_text.trim()) {
        setError(`Question ${i + 1} is missing a question text`);
        return;
      }
      
      // Validate options for multiple choice questions
      if (['radio', 'checkbox'].includes(questions[i].question_type)) {
        const options = questions[i].options || [];
        if (options.length < 2) {
          setError(`Question ${i + 1} needs at least 2 options`);
          return;
        }
        
        for (let j = 0; j < options.length; j++) {
          if (!options[j].trim()) {
            setError(`Option ${j + 1} in Question ${i + 1} cannot be empty`);
            return;
          }
        }
      }
    }
    
    try {
      setIsLoading(true);
      
      let result: Survey;
      
      if (survey) {
        // Update existing survey with all fields
        result = await updateSurvey({
          id: survey.id,
          title: title.trim(),
          description: description.trim() || null,
          is_published: isPublished,
          questions: questions
        });
      } else {
        // Create new survey
        result = await createSurvey({
          title: title.trim(),
          description: description.trim() || undefined,
          company_id: companyId,
          is_published: isPublished,
          questions: questions
        });
      }
      
      onSuccess(result);
      onClose();
    } catch (error: any) {
      console.error('Error saving survey:', error);
      setError(error.message || 'Error saving survey. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>{survey ? 'Edit Survey' : 'Create New Survey'}</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Form Panel */}
          <div className="overflow-y-auto max-h-[70vh]">
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter survey title"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter survey description"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is-published"
                    checked={isPublished}
                    onCheckedChange={setIsPublished}
                  />
                  <Label htmlFor="is-published">Publish survey</Label>
                </div>
                
                {/* Questions Section */}
                <div className="space-y-3 pt-2 border-t">
                  <div className="flex justify-between items-center">
                    <Label>Questions ({questions.length}/5)</Label>
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline" 
                      className="gap-1"
                      onClick={addQuestion}
                      disabled={questions.length >= 5}
                    >
                      <PlusCircle className="h-4 w-4" />
                      Add Question
                    </Button>
                  </div>
                  
                  {questions.length === 0 && (
                    <div className="text-center py-6 border border-dashed rounded-md">
                      <p className="text-sm text-muted-foreground">
                        No questions yet. Click 'Add Question' to create your first question.
                      </p>
                    </div>
                  )}
                  
                  {/* Question List */}
                  <div className="space-y-4">
                    {questions.map((question, questionIndex) => (
                      <QuestionItem
                        key={question.id}
                        question={question}
                        index={questionIndex}
                        questionTypes={questionTypes}
                        updateQuestion={updateQuestion}
                        deleteQuestion={deleteQuestion}
                        addQuestionOption={addQuestionOption}
                        updateQuestionOption={updateQuestionOption}
                        deleteQuestionOption={deleteQuestionOption}
                      />
                    ))}
                  </div>
                </div>
              </div>
              
              <DialogFooter className="pt-4 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : survey ? 'Update Survey' : 'Create Survey'}
                </Button>
              </DialogFooter>
            </form>
          </div>
          
          {/* Preview Panel */}
          <div className="border rounded-md p-4 bg-slate-50 overflow-y-auto max-h-[70vh]">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Preview</h3>
            <SurveyPreview
              companyId={companyId}
              title={title}
              description={description}
              isPublished={isPublished}
              questions={questions}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}