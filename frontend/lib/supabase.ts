import { createClient } from '@supabase/supabase-js';

// Supabase now uses "publishable key" instead of "anon key"
const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const key = process.env.SUPABASE_SECRET_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';

// Create client with placeholders for build time
export const supabase = createClient(url, key);

// Validate at runtime (not build time)
if (typeof window !== 'undefined' || process.env.NODE_ENV === 'production') {
  const hasValidUrl = url !== 'https://placeholder.supabase.co';
  const hasValidKey = key !== 'placeholder-key';

  if (!hasValidUrl || !hasValidKey) {
    console.error('Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY');
  }
}
