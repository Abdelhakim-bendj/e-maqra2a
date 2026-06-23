import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://172.20.10.3:8082/api';

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

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiEnvelope<unknown>;
    if (payload?.success !== undefined) {
      if (!payload.success) {
        return Promise.reject(new ApiError(payload.message || 'خطأ في الخادم', response.status, payload.errors));
      }
      response.data = payload.data;
    }
    return response;
  },
  async (error) => {
    if (error.response) {
      const payload = error.response.data as ApiEnvelope<unknown> | undefined;
      const msg = payload?.message || error.response.statusText || 'تعذر الاتصال بالخادم';
      return Promise.reject(new ApiError(msg, error.response.status, payload?.errors as any));
    }
    return Promise.reject(new ApiError('لا يوجد اتصال بالإنترنت', 0));
  }
);

export default apiClient;
