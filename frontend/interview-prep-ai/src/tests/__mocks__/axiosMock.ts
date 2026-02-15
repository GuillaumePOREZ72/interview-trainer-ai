/**
 * Axios Mock for Testing
 *
 * Provides a mock implementation of axios for testing API calls
 * without making actual network requests.
 */
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from "axios";

// Type for mock response
export interface MockResponse<T = unknown> {
  data: T;
  status?: number;
  statusText?: string;
  headers?: Record<string, string>;
}

// Type for mock error
export interface MockErrorConfig {
  status: number;
  data?: { message: string };
  message?: string;
}

// Store for mocked responses
const mockResponses: Map<string, MockResponse | MockErrorConfig> = new Map();
const mockErrors: Map<string, MockErrorConfig> = new Map();

/**
 * Mock axios instance
 */
export const mockAxiosInstance = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: {
      use: jest.fn(),
      eject: jest.fn(),
    },
    response: {
      use: jest.fn(),
      eject: jest.fn(),
    },
  },
  defaults: {
    headers: {
      common: {},
    },
  },
};

/**
 * Setup a successful mock response for a specific URL
 */
export function mockSuccessResponse<T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  data: T,
  status = 200
): void {
  const response: AxiosResponse<T> = {
    data,
    status,
    statusText: "OK",
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };

  mockAxiosInstance[method].mockImplementation((requestUrl: string) => {
    if (requestUrl === url || requestUrl.includes(url)) {
      return Promise.resolve(response);
    }
    return Promise.reject(new Error(`No mock for ${requestUrl}`));
  });
}

/**
 * Setup an error response for a specific URL
 */
export function mockErrorResponse(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  status: number,
  message = "Error"
): void {
  const error = {
    response: {
      status,
      data: { message },
    },
    message,
    isAxiosError: true,
  } as AxiosError<{ message: string }>;

  mockAxiosInstance[method].mockImplementation((requestUrl: string) => {
    if (requestUrl === url || requestUrl.includes(url)) {
      return Promise.reject(error);
    }
    return Promise.reject(new Error(`No mock for ${requestUrl}`));
  });
}

/**
 * Create a chainable mock that can handle multiple URLs
 */
export function createMockAxios() {
  const responses: Map<string, { method: string; response: unknown; isError: boolean }> = new Map();

  type MockAxiosInstance = typeof mockAxiosInstance & {
    mockGet<T>(url: string, data: T): MockAxiosInstance;
    mockPost<T>(url: string, data: T): MockAxiosInstance;
    mockError(method: string, url: string, status: number, message: string): MockAxiosInstance;
    apply(): void;
  };

  const instance: MockAxiosInstance = {
    ...mockAxiosInstance,

    mockGet<T>(url: string, data: T): MockAxiosInstance {
      responses.set(`GET:${url}`, { method: "get", response: { data }, isError: false });
      return instance;
    },

    mockPost<T>(url: string, data: T): MockAxiosInstance {
      responses.set(`POST:${url}`, { method: "post", response: { data }, isError: false });
      return instance;
    },

    mockError(method: string, url: string, status: number, message: string): MockAxiosInstance {
      responses.set(`${method.toUpperCase()}:${url}`, {
        method,
        response: { response: { status, data: { message } }, isAxiosError: true },
        isError: true,
      });
      return instance;
    },

    apply(): void {
      responses.forEach((config, key) => {
        const [method] = key.split(":");
        const methodLower = method.toLowerCase() as keyof typeof mockAxiosInstance;

        if (config.isError) {
          (mockAxiosInstance[methodLower] as jest.Mock).mockRejectedValue(config.response);
        } else {
          (mockAxiosInstance[methodLower] as jest.Mock).mockResolvedValue(config.response);
        }
      });
    },
  };

  return instance;
}

/**
 * Reset all axios mocks
 */
export function resetAxiosMocks(): void {
  Object.values(mockAxiosInstance).forEach((mock) => {
    if (typeof mock === "function" && "mockReset" in mock) {
      (mock as jest.Mock).mockReset();
    }
  });
  mockResponses.clear();
  mockErrors.clear();
}

export default mockAxiosInstance;

