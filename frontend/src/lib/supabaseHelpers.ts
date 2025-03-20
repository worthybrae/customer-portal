// src/lib/supabaseHelpers.ts
import { PostgrestError } from '@supabase/supabase-js'

/**
 * Safely handles querying for a potentially non-existent row
 * Returns null instead of throwing PGRST116 error when no rows are found
 */
export async function safeQuerySingle<T>(
  queryPromise: Promise<{
    data: T | null;
    error: PostgrestError | null;
  }>
): Promise<{
  data: T | null;
  error: PostgrestError | null;
}> {
  try {
    const { data, error } = await queryPromise

    // Handle the specific "0 rows" error code
    if (error && error.code === 'PGRST116') {
      return { data: null, error: null }
    }

    return { data, error }
  } catch (err) {
    console.error('Error in safeQuerySingle:', err)
    return { data: null, error: err as PostgrestError }
  }
}

/**
 * Helper wrapper to use with Supabase queries that should return a single row
 * but might return zero rows
 */
export function withSafeQuery<T, U extends any[]>(
  queryFn: (...args: U) => Promise<{
    data: T | null;
    error: PostgrestError | null;
  }>
) {
  return async (...args: U) => {
    return safeQuerySingle(queryFn(...args))
  }
}