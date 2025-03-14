// src/services/companyService.ts
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'

export interface CreateCompanyData {
  name: string;
  domain: string;
  logoUrl?: string;
  userId: string;
}

export const getUserCompany = async (userId: string) => {
  try {
    // Get user-company relationship
    const { data: userCompanyData, error: userCompanyError } = await supabase
      .from('user_companies')
      .select('company_id')
      .eq('user_id', userId)
      .single()

    if (userCompanyError) {
      // No company association found
      return { company: null, error: null }
    }

    // Get company details
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('id', userCompanyData.company_id)
      .single()

    if (companyError) throw companyError

    return { company, error: null }
  } catch (error: any) {
    console.error('Error fetching user company:', error)
    return { company: null, error }
  }
}

export const createCompany = async ({ name, domain, logoUrl, userId }: CreateCompanyData) => {
  try {
    // Create the company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name,
        domain,
        logo_url: logoUrl,
        is_personal: false
      })
      .select()

    if (companyError) throw companyError

    if (!companyData || companyData.length === 0) {
      throw new Error('Failed to create company')
    }

    // Associate user with company as owner
    const { error: userCompanyError } = await supabase
      .from('user_companies')
      .insert({
        user_id: userId,
        company_id: companyData[0].id,
        role: 'owner'
      })

    if (userCompanyError) throw userCompanyError

    toast.success('Company created successfully')
    return { company: companyData[0], error: null }
  } catch (error: any) {
    console.error('Error creating company:', error)
    toast.error(error.message || 'Failed to create company')
    return { company: null, error }
  }
}

export const createPersonalCompany = async (userId: string, fullName: string) => {
  try {
    // Create a personal company
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: `${fullName}'s Personal Account`,
        domain: 'personal',
        is_personal: true
      })
      .select()

    if (companyError) throw companyError

    if (!companyData || companyData.length === 0) {
      throw new Error('Failed to create personal company')
    }

    // Associate user with company as owner
    const { error: userCompanyError } = await supabase
      .from('user_companies')
      .insert({
        user_id: userId,
        company_id: companyData[0].id,
        role: 'owner'
      })

    if (userCompanyError) throw userCompanyError

    return { company: companyData[0], error: null }
  } catch (error: any) {
    console.error('Error creating personal company:', error)
    return { company: null, error }
  }
}

export const findCompanyByDomain = async (domain: string) => {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('id')
      .eq('domain', domain)
      .single()

    if (error) {
      // No company found with this domain
      return { companyId: null, error: null }
    }

    return { companyId: data.id, error: null }
  } catch (error: any) {
    console.error('Error finding company by domain:', error)
    return { companyId: null, error }
  }
}

export const associateUserWithCompany = async (userId: string, companyId: string, role: 'owner' | 'member' = 'member') => {
  try {
    const { error } = await supabase
      .from('user_companies')
      .insert({
        user_id: userId,
        company_id: companyId,
        role
      })

    if (error) throw error

    return { error: null }
  } catch (error: any) {
    console.error('Error associating user with company:', error)
    return { error }
  }
}

// Helper function to check if an email domain is likely a business domain
export const isBusinessDomain = (domain: string) => {
  const personalDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com', 'gmx.com', 'mail.com']
  return !personalDomains.includes(domain.toLowerCase())
}