// components/surveys/SurveyResponse.tsx
import { useState, useEffect } from 'react';
import { submitSurveyResponse, checkSurveyResponseByEmail } from '../../lib/supabase';
import { Survey, SurveyQuestion } from '../../types';
import EmailVerificationFlow from './EmailVerificationFlow';

// Import shadcn components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { LoadingSpinner } from '../ui/loading-spinner';

type SurveyResponseProps = {
  survey: Survey;
  onSubmitSuccess: () => void;
};

type AnswerData = {
  [questionId: string]: {
    answer_text: string;
    answer_value: any;
  };
};

export default function SurveyResponse({ 
  survey, 
  onSubmitSuccess
}: SurveyResponseProps) {
  const { toast } = useToast();
  
  const [answers, setAnswers] = useState<AnswerData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<{[questionId: string]: string}>({});
  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [checkingPrevSubmission, setCheckingPrevSubmission] = useState(false);

  // Check if email has already submitted a response when email is verified
  useEffect(() => {
    if (verifiedEmail && survey.id) {
      const checkPreviousSubmission = async () => {
        setCheckingPrevSubmission(true);
        try {
          const hasSubmitted = await checkSurveyResponseByEmail(survey.id, verifiedEmail);
          setAlreadySubmitted(hasSubmitted);
          
          if (hasSubmitted) {
            toast({
              title: "Already Submitted",
              description: "You have already submitted a response to this survey.",
              variant: "destructive"
            });
          }
        } catch (error) {
          console.error('Error checking previous submission:', error);
        } finally {
          setCheckingPrevSubmission(false);
        }
      };
      
      checkPreviousSubmission();
    }
  }, [verifiedEmail, survey.id, toast]);

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  
  // Handle text-based answers (text, textarea, date, number)
  const handleTextAnswer = (question: SurveyQuestion, value: string) => {
    // If not verified and not showing verification, prompt for verification
    if (!verifiedEmail && !showEmailVerification) {
      setShowEmailVerification(true);
      return;
    }
    
    if (alreadySubmitted) {
      toast({
        title: "Already Submitted",
        description: "You have already submitted a response to this survey.",
        variant: "destructive"
      });
      return;
    }
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        answer_text: value,
        answer_value: question.question_type === 'number' ? Number(value) : value
      }
    }));
    
    // Clear validation error if any
    if (validationErrors[question.id]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[question.id];
        return newErrors;
      });
    }
  };

  // Handle single choice (radio) answers
  const handleRadioAnswer = (question: SurveyQuestion, value: string) => {
    // If not verified and not showing verification, prompt for verification
    if (!verifiedEmail && !showEmailVerification) {
      setShowEmailVerification(true);
      return;
    }
    
    if (alreadySubmitted) {
      toast({
        title: "Already Submitted",
        description: "You have already submitted a response to this survey.",
        variant: "destructive"
      });
      return;
    }
    
    setAnswers(prev => ({
      ...prev,
      [question.id]: {
        answer_text: value,
        answer_value: value
      }
    }));
    
    // Clear validation error if any
    if (validationErrors[question.id]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[question.id];
        return newErrors;
      });
    }
  };

  // Handle multiple choice (checkbox) answers
  const handleCheckboxAnswer = (question: SurveyQuestion, option: string, checked: boolean) => {
    // If not verified and not showing verification, prompt for verification
    if (!verifiedEmail && !showEmailVerification) {
      setShowEmailVerification(true);
      return;
    }
    
    if (alreadySubmitted) {
      toast({
        title: "Already Submitted",
        description: "You have already submitted a response to this survey.",
        variant: "destructive"
      });
      return;
    }
    
    setAnswers(prev => {
      const currentAnswer = prev[question.id] || { answer_text: '', answer_value: [] };
      let selectedOptions = Array.isArray(currentAnswer.answer_value) 
        ? [...currentAnswer.answer_value] 
        : [];
      
      if (checked) {
        selectedOptions.push(option);
      } else {
        selectedOptions = selectedOptions.filter(item => item !== option);
      }
      
      return {
        ...prev,
        [question.id]: {
          answer_text: selectedOptions.join(', '),
          answer_value: selectedOptions
        }
      };
    });
    
    // Clear validation error if any
    if (validationErrors[question.id]) {
      setValidationErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[question.id];
        return newErrors;
      });
    }
  };

  // Check if a checkbox option is selected
  const isCheckboxSelected = (question: SurveyQuestion, option: string) => {
    const answer = answers[question.id];
    if (!answer || !answer.answer_value) return false;
    
    return Array.isArray(answer.answer_value) && answer.answer_value.includes(option);
  };

  const validateAnswers = () => {
    const errors: {[questionId: string]: string} = {};
    
    survey.questions?.forEach(question => {
      if (question.required) {
        const answer = answers[question.id];
        
        if (!answer || !answer.answer_text.trim()) {
          errors[question.id] = 'This question requires an answer';
        } else if (question.question_type === 'checkbox' && 
                  (!Array.isArray(answer.answer_value) || answer.answer_value.length === 0)) {
          errors[question.id] = 'Please select at least one option';
        }
      }
    });
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check if email has been verified
    if (!verifiedEmail) {
      toast({
        title: "Email Verification Required",
        description: "Please verify your email before submitting the survey.",
        variant: "destructive"
      });
      return;
    }
    
    if (alreadySubmitted) {
      toast({
        title: "Already Submitted",
        description: "You have already submitted a response to this survey.",
        variant: "destructive"
      });
      return;
    }
    
    // Validate required questions
    if (!validateAnswers()) {
      toast({
        variant: "destructive",
        title: "Missing Answers",
        description: "Please answer all required questions",
      });
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Format answers for submission
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        question_id: questionId,
        email: verifiedEmail, // Use email as respondent ID
        survey_id: survey.id,
        answer_text: answer.answer_text,
        answer_value: answer.answer_value
      }));
      
      await submitSurveyResponse(formattedAnswers);
      
      onSubmitSuccess();
    } catch (error) {
      console.error('Error submitting response:', error);
      toast({
        variant: "destructive",
        title: "Submission Error",
        description: "Failed to submit your response. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerificationSuccess = (email: string) => {
    setVerifiedEmail(email);
    setShowEmailVerification(false);
    toast({
      title: "Email Verified",
      description: "Your email has been verified. You can now complete and submit the survey.",
    });
  };

  const handleCancelVerification = () => {
    setShowEmailVerification(false);
  };

  // Show already submitted message
  if (alreadySubmitted) {
    return (
      <Alert className="bg-yellow-50 border-yellow-200">
        <AlertDescription className="text-yellow-800">
          <div className="flex flex-col items-center text-center py-4">
            <h3 className="text-lg font-medium mb-2">You've already responded</h3>
            <p className="mb-4">You have already submitted a response to this survey using the email address {verifiedEmail}.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setVerifiedEmail(null);
                setAlreadySubmitted(false);
              }}
            >
              Use a different email address
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading state while checking previous submission
  if (checkingPrevSubmission) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" />
        <span className="ml-2">Checking previous submissions...</span>
      </div>
    );
  }

  // Show email verification if needed
  if (showEmailVerification) {
    return (
      <EmailVerificationFlow
        onVerificationSuccess={handleVerificationSuccess}
        onCancel={handleCancelVerification}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {survey.questions?.length === 0 ? (
        <Alert>
          <AlertDescription>This survey doesn't have any questions.</AlertDescription>
        </Alert>
      ) : (
        <>
          {verifiedEmail && (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-green-800">
                Email verified: {verifiedEmail}
              </AlertDescription>
            </Alert>
          )}
          
          {/* Questions */}
          {survey.questions?.map((question, _) => (
            <div 
              key={question.id} 
              className={`p-4 border rounded-md ${validationErrors[question.id] ? 'border-destructive' : 'border-border'}`}
            >
              <div className="mb-3">
                <Label className="text-base font-medium flex items-start gap-1">
                  <span>{question.question_text}</span>
                  {question.required && (
                    <span className="text-destructive">*</span>
                  )}
                </Label>
                {validationErrors[question.id] && (
                  <p className="text-sm text-destructive mt-1">{validationErrors[question.id]}</p>
                )}
              </div>
              
              {/* Different input types based on question type */}
              {question.question_type === 'text' && (
                <Input
                  value={(answers[question.id]?.answer_text || '')}
                  onChange={(e) => handleTextAnswer(question, e.target.value)}
                  placeholder="Your answer"
                />
              )}
              
              {question.question_type === 'textarea' && (
                <Textarea
                  value={(answers[question.id]?.answer_text || '')}
                  onChange={(e) => handleTextAnswer(question, e.target.value)}
                  placeholder="Your answer"
                  rows={4}
                />
              )}
              
              {question.question_type === 'number' && (
                <Input
                  type="number"
                  value={(answers[question.id]?.answer_text || '')}
                  onChange={(e) => handleTextAnswer(question, e.target.value)}
                  placeholder="0"
                />
              )}
              
              {question.question_type === 'date' && (
                <Input
                  type="date"
                  value={(answers[question.id]?.answer_text || '')}
                  onChange={(e) => handleTextAnswer(question, e.target.value)}
                />
              )}
              
              {question.question_type === 'radio' && (
                <RadioGroup 
                  value={answers[question.id]?.answer_text || ''}
                  onValueChange={(value) => handleRadioAnswer(question, value)}
                  className="mt-2 space-y-2"
                >
                  {question.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${question.id}-${i}`} />
                      <Label htmlFor={`option-${question.id}-${i}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
              
              {question.question_type === 'checkbox' && (
                <div className="mt-2 space-y-2">
                  {question.options?.map((option, i) => (
                    <div key={i} className="flex items-center space-x-2">
                      <Checkbox
                        id={`checkbox-${question.id}-${i}`}
                        checked={isCheckboxSelected(question, option)}
                        onCheckedChange={(checked) => 
                          handleCheckboxAnswer(question, option, checked as boolean)
                        }
                      />
                      <Label htmlFor={`checkbox-${question.id}-${i}`} className="text-sm">
                        {option}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          
          <div className="mt-6">
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !verifiedEmail}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Submitting...</span>
                </span>
              ) : 'Submit Response'}
            </Button>
            
            {!verifiedEmail && (
              <p className="text-sm text-center mt-2 text-muted-foreground">
                You'll need to verify your email before submitting
              </p>
            )}
          </div>
        </>
      )}
    </form>
  );
}