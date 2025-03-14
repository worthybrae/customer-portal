// src/types/index.ts

export interface Company {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Survey {
    id: string;
    company_id: string;
    title: string;
    description: string;
    is_published: boolean;
    created_at: string;
    updated_at: string;
  }
  
  export type QuestionType = 'text' | 'multiple_choice' | 'rating' | 'yes_no';
  
  export interface Question {
    id: string;
    survey_id: string;
    question_text: string;
    question_type: QuestionType;
    options?: string[];
    required: boolean;
    order: number;
    created_at: string;
    updated_at: string;
  }
  
  export interface Response {
    id: string;
    survey_id: string;
    respondent_id: string;
    created_at: string;
    updated_at: string;
  }
  
  export interface Answer {
    id: string;
    response_id: string;
    question_id: string;
    answer_text?: string;
    answer_value?: any;
    created_at: string;
    updated_at: string;
  }
  
  // For the UI
  export interface QuestionFormData {
    question_text: string;
    question_type: QuestionType;
    options?: string[];
    required: boolean;
  }
  
  export interface SurveyFormData {
    title: string;
    description: string;
    questions: QuestionFormData[];
  }