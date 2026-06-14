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
    super(message);
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
  retryOnUnauthorized = true
): Promise<T> => {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (response.status === 401 && retryOnUnauthorized && endpoint !== '/auth/refresh') {
    await apiCall<null>('/auth/refresh', { method: 'POST' }, false);
    return apiCall<T>(endpoint, options, false);
  }

  return parseResponse<T>(response);
};
