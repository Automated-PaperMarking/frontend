import { API_BASE } from "@/config/env";

export interface ApiRequestOptions extends RequestInit {
  timeout?: number;
}

export interface ApiResponse<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
}

const DEFAULT_TIMEOUT = 30000; // 30 seconds

/**
 * Generic API client with timeout support
 */
export async function apiCall<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<ApiResponse<T>> {
  const { timeout = DEFAULT_TIMEOUT, ...fetchOptions } = options;

  // Construct URL properly - avoid double slashes
  const baseUrl = API_BASE.endsWith('/') ? API_BASE.slice(0, -1) : API_BASE;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${baseUrl}${path}`;

  // Set default headers
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...fetchOptions.headers,
  };

  // Add auth token if available
  const token = localStorage.getItem("ai-grade-token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Log request details for debugging
  if (fetchOptions.body) {
    console.log(`[API Request] ${fetchOptions.method || 'GET'} ${url}`, {
      body: JSON.parse(fetchOptions.body as string),
      headers,
    });
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    const data = await response.json().catch(() => null);

    console.log(`[API Response] ${response.status} ${url}`, data);

    // Log full error details for debugging
    if (!response.ok) {
      console.error(`[API Error] ${response.status} ${url}:`, {
        statusText: response.statusText,
        responseData: data,
      });
    }

    return {
      ok: response.ok,
      status: response.status,
      data: response.ok ? data : undefined,
      error: !response.ok ? data?.message || data?.detail || response.statusText : undefined,
    };
  } catch (error) {
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return {
        ok: false,
        status: 0,
        error: "Network error. Please check your connection and that the server is running.",
      };
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        ok: false,
        status: 0,
        error: `Request timeout after ${timeout}ms`,
      };
    }
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * GET request
 */
export async function get<T>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, { ...options, method: "GET" });
}

/**
 * POST request
 */
export async function post<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT request
 */
export async function put<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * PATCH request
 */
export async function patch<T>(
  endpoint: string,
  body?: unknown,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    ...options,
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE request
 */
export async function del<T>(
  endpoint: string,
  options?: ApiRequestOptions
): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, { ...options, method: "DELETE" });
}
