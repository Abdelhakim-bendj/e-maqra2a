import { createClient } from '@supabase/supabase-js';

export type AccessTokenPayload = {
  sub: string;
  email?: string;
  user_metadata?: any;
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://cdrlhdwlgvgwqwoewvac.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey!);

export async function verifyAccessToken(token: string): Promise<AccessTokenPayload> {
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    const err = new Error('Invalid token');
    err.name = 'JsonWebTokenError';
    throw err;
  }

  return {
    sub: data.user.id,
    email: data.user.email,
    user_metadata: data.user.user_metadata
  };
}
