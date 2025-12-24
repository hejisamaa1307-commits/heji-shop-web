import { createClient } from '@supabase/supabase-js'

// Supabase client configuration
// NOTE: To fix CORS errors, add your domain to Supabase Dashboard:
// Settings > API > Allowed Origins > Add: https://fatshopacc.com
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  }
)

// Admin client with service role key to bypass RLS (only use on server-side or for admin operations)
const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

// Log để debug (chỉ log length, không log full key)
if (typeof window === 'undefined') { // Server-side only
  console.log('🔍 Supabase Admin Client Init:', {
    hasServiceKey: !!serviceRoleKey,
    serviceKeyLength: serviceRoleKey?.length || 0,
    hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  });
}

export const supabaseAdmin = serviceRoleKey && process.env.NEXT_PUBLIC_SUPABASE_URL
  ? createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey.trim(), // Remove any whitespace
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : null