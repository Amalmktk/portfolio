import axios, { type AxiosRequestConfig, type AxiosError } from 'axios';
import type { ApiCallOptions } from '@/types/common';
import { API_BASE_URL } from '@config/environment';

/**
 * A generic API calling function using axios.
 */
export const apiCall = async <T = unknown>({
  endpoint,
  method,
  body,
  authorized = false,
  headers = {},
}: ApiCallOptions): Promise<T> => {
  const url = `${API_BASE_URL}${endpoint}`;

  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (authorized) {
    const token = localStorage.getItem('token');
    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  const config: AxiosRequestConfig = {
    url,
    method,
    headers: requestHeaders,
    data: body,
  };

  try {
    const response = await axios<T>(config);
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<{ message?: string }>;
      console.error(
        'API Call Axios Error:',
        axiosError.response?.data || axiosError.message
      );
      throw new Error(
        axiosError.response?.data?.message ||
          axiosError.message ||
          'An error occurred during the API call',
        { cause: error }
      );
    } else {
      console.error('API Call Unexpected Error:', error);
      throw error;
    }
  }
};
