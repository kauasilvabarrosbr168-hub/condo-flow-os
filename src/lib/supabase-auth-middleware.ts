// Middleware de autenticação com URL hardcoded.
// NÃO usar src/integrations/supabase/auth-middleware — Lovable regenera aquele arquivo
// na build deles e sobrescreve a URL com o projeto errado (unpaytnhbyccpimscscj).
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';

const SUPABASE_URL = 'https://jqcipbecgxssbjayusci.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpxY2lwYmVjZ3hzc2JqYXl1c2NpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk0NjIzOTEsImV4cCI6MjA5NTAzODM5MX0.OiC94pzx9aL8STwoQSOLyqq-cxv07DM2fZ01TK6F0nY';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const request = getRequest();

    if (!request?.headers) {
      throw new Error('Unauthorized: No request headers available');
    }

    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Bearer token ausente');
    }

    const token = authHeader.replace('Bearer ', '');

    let userData: { id: string; email?: string; [key: string]: unknown };
    try {
      const authRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
      });
      if (!authRes.ok) {
        const body = await authRes.text().catch(() => '');
        throw new Error(`Auth failed: ${authRes.status} at ${SUPABASE_URL} — ${body}`);
      }
      userData = await authRes.json();
      if (!userData?.id) throw new Error('Auth failed: user id ausente');
    } catch (err) {
      if (err instanceof Error && err.message.startsWith('Auth failed')) throw err;
      throw new Error(`Auth error: ${err instanceof Error ? err.message : String(err)}`);
    }

    const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    });

    return next({
      context: { supabase, userId: userData.id, claims: userData },
    });
  },
);
