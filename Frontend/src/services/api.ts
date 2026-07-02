import { supabase } from '../lib/supabase';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

type ApiEnvelope<T> = {
  success: boolean;
  message: string;
  data: T;
  errors?: Array<{ field: string; message: string }>;
};

export class ApiError extends Error {
  status: number;
  errors?: Array<{ field: string; message: string }>;

  constructor(message: string, status: number, errors?: Array<{ field: string; message: string }>) {
    const formattedMessage = errors && errors.length > 0
      ? errors.map(e => e.message).join('\n')
      : message;
    super(formattedMessage);
    this.status = status;
    this.errors = errors;
  }
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as ApiEnvelope<T> | null;

  if (!response.ok || !payload?.success) {
    throw new ApiError(payload?.message || 'تعذر الاتصال بالخادم', response.status, payload?.errors);
  }

  return payload.data;
}

export const apiCall = async <T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> => {
  // Try to get current Supabase session token if none is explicitly provided in headers
  const existingAuth = (options.headers as Record<string, string>)?.['Authorization'];

  let authHeader = existingAuth;
  if (!authHeader) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      authHeader = `Bearer ${session.access_token}`;
    }
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
      ...(options.headers || {}),
    },
  });

  // If 401, try to refresh the Supabase session and retry once
  if (response.status === 401 && !existingAuth) {
    const { data: { session } } = await supabase.auth.refreshSession();
    if (session?.access_token) {
      const retryResponse = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          ...(options.headers || {}),
        },
      });
      return parseResponse<T>(retryResponse);
    }
  }

  return parseResponse<T>(response);
};
