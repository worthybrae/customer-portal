// components/surveys/SurveyPreview.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Company, SurveyQuestion } from '../../types';

// Import shadcn components
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Checkbox } from '../ui/checkbox';

type SurveyPreviewProps = {
  companyId: string;
  title: string;
  description: string;
  isPublished: boolean;
  questions?: SurveyQuestion[];
};

export default function SurveyPreview({ 
  companyId, 
  title, 
  description, 
  isPublished,
  questions = []
}: SurveyPreviewProps) {
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCompanyData = async () => {
      if (!companyId) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('companies')
          .select('*')
          .eq('id', companyId)
          .single();
        
        if (error) {
          console.error('Error fetching company data:', error);
        } else {
          setCompany(data);
        }
      } catch (error) {
        console.error('Error in fetch company data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanyData();
  }, [companyId]);

  if (isLoading) {
    return (
      <Card className="w-full h-full">
        <CardHeader>
          <Skeleton className="h-8 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32 w-full mb-4" />
          <Skeleton className="h-6 w-24" />
        </CardContent>
        <CardFooter>
          <Skeleton className="h-4 w-full" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full h-full flex flex-col">
      {/* Company Banner */}
      {company?.banner_url && (
        <div className="h-32 overflow-hidden">
          <img 
            src={company.banner_url} 
            alt={`${company.name} banner`} 
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = '/api/placeholder/400/128'; 
              target.alt = 'Banner image not found';
            }}
          />
        </div>
      )}

      <CardHeader className="pb-2">
        <div className="flex items-center gap-3 mb-2">
          {/* Company Logo */}
          {company && (
            <div className="h-10 w-10 bg-gray-100 flex items-center justify-center rounded-md overflow-hidden">
              {company.logo_url ? (
                <img 
                  src={company.logo_url} 
                  alt={`${company.name} logo`} 
                  className="h-full w-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = '/api/placeholder/40/40'; 
                    target.alt = 'Logo image not found';
                  }}
                />
              ) : (
                <span className="text-sm font-medium text-gray-500">
                  {company.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          
          {/* Survey Title */}
          <CardTitle className="line-clamp-1">
            {title || 'Survey Title'}
          </CardTitle>
        </div>
        
        {/* Status Badge */}
        <div>
          <Badge variant={isPublished ? "default" : "outline"}>
            {isPublished ? "Published" : "Draft"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="flex-grow pb-2">
        <p className="text-sm text-muted-foreground mb-4">
          {description || 'No description provided'}
        </p>
        
        {/* Questions */}
        {questions.length === 0 ? (
          <div className="border rounded-md p-3 bg-slate-50">
            <p className="text-sm text-center text-muted-foreground italic">
              No questions added yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => (
              <div key={question.id} className="border rounded-md p-3 bg-white">
                <div className="mb-2 flex justify-between items-start">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    {question.question_text}
                    {question.required && (
                      <span className="text-red-500">*</span>
                    )}
                  </Label>
                  <Badge variant="outline" className="text-xs">
                    Question {index + 1}
                  </Badge>
                </div>
                
                {/* Question inputs based on type */}
                <div className="mt-2">
                  {question.question_type === 'text' && (
                    <Input disabled placeholder="Short text answer" className="bg-slate-50" />
                  )}
                  
                  {question.question_type === 'textarea' && (
                    <Textarea disabled placeholder="Long text answer" className="bg-slate-50" />
                  )}
                  
                  {question.question_type === 'number' && (
                    <Input disabled type="number" placeholder="0" className="bg-slate-50" />
                  )}
                  
                  {question.question_type === 'date' && (
                    <Input disabled type="date" className="bg-slate-50" />
                  )}
                  
                  {question.question_type === 'radio' && question.options && (
                    <RadioGroup disabled className="mt-2 space-y-2">
                      {question.options.map((option, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <RadioGroupItem value={`option-${i}`} id={`option-${index}-${i}`} disabled />
                          <Label htmlFor={`option-${index}-${i}`} className="text-sm">
                            {option || `Option ${i + 1}`}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  )}
                  
                  {question.question_type === 'checkbox' && question.options && (
                    <div className="mt-2 space-y-2">
                      {question.options.map((option, i) => (
                        <div key={i} className="flex items-center space-x-2">
                          <Checkbox id={`checkbox-${index}-${i}`} disabled />
                          <Label htmlFor={`checkbox-${index}-${i}`} className="text-sm">
                            {option || `Option ${i + 1}`}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CardFooter className="mt-auto border-t pt-4">
        {company?.privacy_policy ? (
          <p className="text-xs text-muted-foreground">
            By responding, you agree to the{' '}
            <a 
              href={company.privacy_policy}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Privacy Policy
            </a>
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">
            {company?.name || 'Company'} Survey
          </p>
        )}
      </CardFooter>
    </Card>
  );
}