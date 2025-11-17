import { supabase } from '../lib/supabase.js'

export const createSubmission = async (submissionData) => {
  if (!supabase) throw new Error('Supabase client not configured')

  const { spaceName, address, additionalInfo, email } = submissionData

  if (!spaceName || !spaceName.trim()) {
    throw new Error('Space name is required')
  }

  if (!email || !email.trim()) {
    throw new Error('Email is required')
  }

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.trim())) {
    throw new Error('Please enter a valid email address')
  }

  const insertData = {
    space_name: spaceName.trim(),
    address: address?.trim() || null,
    additional_info: additionalInfo?.trim() || null,
    contact_info: email.trim(),
  }

  const { data, error } = await supabase.from('submissions').insert(insertData).select().single()

  if (error) throw error
  if (!data) throw new Error('Failed to create submission')

  return data
}

