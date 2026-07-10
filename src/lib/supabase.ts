import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

export const supabase = createClient<Database>(
  'https://jqcipbecgxssbjayusci.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxY2lwYmVjZ3hzc2JqYXl1c2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjIzOTEsImV4cCI6MjA5NTAzODM5MX0.OiC94pzx9aL8STwoQSOLyqq-cxv07DM2fZ01TK6F0nY',
  {
    auth: {
      storage: typeof window !== 'undefined' ? localStorage : undefined,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)
