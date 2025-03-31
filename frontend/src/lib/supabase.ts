import { createClient } from '@supabase/supabase-js';
import { Database, SurveyQuestion } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Company-related functions
export async function checkCompanyDomain(domain: string) {
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('domain', domain)
    .single();
  
  if (error && error.code !== 'PGSQL_ERROR_NO_DATA_FOUND') {
    console.error('Error checking company domain:', error);
  }
  
  return { company: data, exists: !!data };
}

export async function createCompany(companyData: {
  name: string;
  domain: string;
  logo_url?: string;
  banner_url?: string;
  privacy_policy?: string;
}) {
  const { data, error } = await supabase
    .from('companies')
    .insert([
      { 
        name: companyData.name,
        domain: companyData.domain,
        logo_url: companyData.logo_url || null,
        banner_url: companyData.banner_url || null, 
        privacy_policy: companyData.privacy_policy || null,
        is_personal: false
      }
    ])
    .select()
    .single();
  
  if (error) {
    console.error('Error creating company:', error);
    throw error;
  }
  
  return data;
}

// User authentication functions
export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/signin`, // Redirect to sign in after verification
    }
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) {
    throw error;
  }
  
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }
}

export async function getCurrentUser() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user;
}

export async function resendVerificationEmail(email: string) {
  const { data, error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/signin`,
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

export async function updateUserEmail(newEmail: string) {
  const { data, error } = await supabase.auth.updateUser({
    email: newEmail,
  });

  if (error) {
    throw error;
  }

  return data.user;
}

export async function updateSurvey(surveyData: {
    id: string;
    title: string;
    description: string | null;
    is_published: boolean;
    questions?: SurveyQuestion[];
  }) {
    // First update the survey
    const { data, error } = await supabase
      .from('surveys')
      .update({
        title: surveyData.title,
        description: surveyData.description,
        is_published: surveyData.is_published,
        updated_at: new Date().toISOString()
      })
      .eq('id', surveyData.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating survey:', error);
      throw error;
    }
    
    // If we have questions, update those as well
    if (surveyData.questions && surveyData.questions.length > 0) {
      // First delete all existing questions for this survey
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .eq('survey_id', surveyData.id);
      
      if (deleteError) {
        console.error('Error deleting existing questions:', deleteError);
        throw deleteError;
      }
      
      // Then insert all the new questions
      const questionsToInsert = surveyData.questions.map((q, index) => ({
        survey_id: surveyData.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        required: q.required,
        order: index // Use index as the order to ensure questions are ordered correctly
      }));
      
      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert);
      
      if (insertError) {
        console.error('Error inserting questions:', insertError);
        throw insertError;
      }
    }
    
    // Now fetch the updated survey with questions
    const { data: updatedSurvey, error: fetchError } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('id', surveyData.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching updated survey:', fetchError);
      throw fetchError;
    }
    
    return updatedSurvey;
  }
  
  // Create a new survey with questions
  export async function createSurvey(surveyData: {
    title: string;
    description?: string;
    company_id: string;
    is_published?: boolean;
    questions?: SurveyQuestion[];
  }) {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    // First create the survey
    const { data: survey, error } = await supabase
      .from('surveys')
      .insert([
        {
          title: surveyData.title,
          description: surveyData.description || null,
          company_id: surveyData.company_id,
          is_published: surveyData.is_published || false,
          created_by: session.user.id
        }
      ])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating survey:', error);
      throw error;
    }
    
    // If we have questions, create those as well
    if (surveyData.questions && surveyData.questions.length > 0) {
      const questionsToInsert = surveyData.questions.map((q, index) => ({
        survey_id: survey.id,
        question_text: q.question_text,
        question_type: q.question_type,
        options: q.options,
        required: q.required,
        order: index // Use index as the order to ensure questions are ordered correctly
      }));
      
      const { error: insertError } = await supabase
        .from('questions')
        .insert(questionsToInsert);
      
      if (insertError) {
        console.error('Error inserting questions:', insertError);
        throw insertError;
      }
    }
    
    // Now fetch the full survey with questions
    const { data: fullSurvey, error: fetchError } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('id', survey.id)
      .single();
    
    if (fetchError) {
      console.error('Error fetching created survey:', fetchError);
      throw fetchError;
    }
    
    return fullSurvey;
  }
  
  // Fetch a survey with its questions
  export async function fetchSurveyWithQuestions(surveyId: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('id', surveyId)
      .single();
    
    if (error) {
      console.error('Error fetching survey with questions:', error);
      throw error;
    }
    
    return data;
  }
  
  // Fetch surveys with questions
  export async function fetchUserSurveysWithQuestions() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }
    
    const { data, error } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('created_by', session.user.id)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching surveys with questions:', error);
      throw error;
    }
    
    return data || [];
  }
  
  // Fetch company surveys with questions
  export async function fetchCompanySurveysWithQuestions(companyId: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching company surveys with questions:', error);
      throw error;
    }
    
    return data || [];
  }
  
  export async function deleteSurvey(surveyId: string) {
    const { error } = await supabase
      .from('surveys')
      .delete()
      .eq('id', surveyId);
    
    if (error) {
      console.error('Error deleting survey:', error);
      throw error;
    }
  }
  
  // Fetch a published survey with company data
  export async function fetchPublishedSurvey(surveyId: string) {
    const { data, error } = await supabase
      .from('surveys')
      .select(`
        *,
        questions:questions(*),
        companies:companies(*)
      `)
      .eq('id', surveyId)
      .eq('is_published', true) // Only return if published
      .single();
    
    if (error) {
      console.error('Error fetching published survey:', error);
      throw error;
    }
    
    if (!data) return null;
    
    return {
      survey: {
        ...data,
        questions: data.questions || []
      },
      company: data.companies
    };
  }
  
  // Submit survey responses
  export async function submitSurveyResponse(answers: Array<{
    question_id: string;
    email: string; // This will be the verified email address
    survey_id: string;
    answer_text: string;
    answer_value: any;
  }>) {
    if (!answers || answers.length === 0) {
      throw new Error('No answers to submit');
    }
    
    // Create a unique respondent hash from the email to help with privacy
    // In a real app, you might want to hash this properly for extra privacy
    const processedAnswers = answers.map(answer => ({
      ...answer,
      // You could add additional processing here if needed
    }));
    
    const { data, error } = await supabase
      .from('answers')
      .insert(processedAnswers);
    
    if (error) {
      console.error('Error submitting survey responses:', error);
      throw error;
    }
    
    return data;
  }
  
  // Check if a respondent has already submitted a response to this survey
  export async function checkSurveyResponseByEmail(surveyId: string, email: string) {
    const { data, error } = await supabase
      .from('answers')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('email', email)
      .limit(1);
    
    if (error) {
      console.error('Error checking survey response:', error);
      throw error;
    }
    
    return data && data.length > 0;
  }
  
  // Check if a user has already responded to a survey
  export async function checkSurveyResponse(surveyId: string, userId: string) {
    const { data, error } = await supabase
      .from('answers')
      .select('id')
      .eq('survey_id', surveyId)
      .eq('email', userId)
      .limit(1);
    
    if (error) {
      console.error('Error checking survey response:', error);
      throw error;
    }
    
    return data && data.length > 0;
  }
  
export async function getSurveyStatistics(surveyId: string) {
    // First get the total number of unique respondents
    const { count: respondentCount, error: countError } = await supabase
      .from('answers')
      .select('email', { count: 'exact', head: true })
      .eq('survey_id', surveyId);
    
    if (countError) {
      console.error('Error counting respondents:', countError);
      throw countError;
    }
    
    // Get response count per question
    const { data: questionStats, error: statsError } = await supabase
      .from('answers')
      .select(`
        question_id,
        questions!inner(question_text, question_type)
      `)
      .eq('survey_id', surveyId);
    
    if (statsError) {
      console.error('Error fetching question stats:', statsError);
      throw statsError;
    }
    
    // Process question stats to get counts per question
    const questionCounts = questionStats.reduce((acc: {[key: string]: number}, curr) => {
      if (!acc[curr.question_id]) {
        acc[curr.question_id] = 0;
      }
      acc[curr.question_id]++;
      return acc;
    }, {});
    
    return {
      totalRespondents: respondentCount,
      questionStats: questionCounts,
      responseData: questionStats
    };
  }
  
  // Fetch survey responses for a specific survey
  export async function fetchSurveyResponses(surveyId: string) {
    const { data, error } = await supabase
      .from('answers')
      .select(`
        *,
        questions:questions(*)
      `)
      .eq('survey_id', surveyId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching survey responses:', error);
      throw error;
    }
    
    return data || [];
  }