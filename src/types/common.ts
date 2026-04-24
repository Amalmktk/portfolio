export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export interface ApiCallOptions {
  endpoint: string;
  method: HttpMethod;
  body?: unknown;
  authorized?: boolean;
  headers?: Record<string, string>;
}
