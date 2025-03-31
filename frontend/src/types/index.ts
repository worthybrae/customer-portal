export type Company = {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
    domain: string;
    logo_url: string | null;
    is_personal: boolean;
    privacy_policy: string | null;
    banner_url: string | null;
  }
  
  export type User = {
    id: string;
    email: string;
    company_id?: string;
    is_personal?: boolean;
  }
  
  export interface Database {
    public: {
      Tables: {
        companies: {
          Row: Company;
          Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>;
        };
        users: {
          Row: User;
          Insert: Omit<User, 'id'>;
          Update: Partial<Omit<User, 'id'>>;
        };
        surveys: {
          Row: Survey;
          Insert: Omit<Survey, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<Survey, 'id' | 'created_at' | 'updated_at'>>;
        };
        questions: {
          Row: SurveyQuestion;
          Insert: Omit<SurveyQuestion, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<SurveyQuestion, 'id' | 'created_at' | 'updated_at'>>;
        };
        answers: {
          Row: SurveyAnswer;
          Insert: Omit<SurveyAnswer, 'id' | 'created_at' | 'updated_at'>;
          Update: Partial<Omit<SurveyAnswer, 'id' | 'created_at' | 'updated_at'>>;
        };
      };
    };
  }
  
  export type AccountType = 'personal' | 'work';
  
  export type WorkDomainResult = {
    exists: boolean;
    company?: Company | null;
  };

  export type QuestionType = 'text' | 'textarea' | 'radio' | 'checkbox' | 'number' | 'date';

export type SurveyQuestion = {
  id: string;
  survey_id: string;
  question_text: string;
  question_type: QuestionType;
  options: string[] | null;
  required: boolean;
  order: number;
  created_at?: string;
  updated_at?: string;
};

// Survey type
export type Survey = {
  id: string;
  company_id: string;
  title: string;
  description: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  questions?: SurveyQuestion[];
  companies?: Company; // For joins
};

// Survey answer type
export type SurveyAnswer = {
  id: string;
  question_id: string;
  email: string;
  survey_id: string;
  answer_text: string;
  answer_value: any; // JSON field for complex answers
  created_at: string;
  updated_at: string;
};