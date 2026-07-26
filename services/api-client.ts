import { ApiError, extractApiErrorMessage } from "./api-errors";
import { clearStoredSession, getAccessToken, getRefreshToken, setSessionTokens } from "./session-service";

type ApiRequestOptions = Omit<RequestInit, "body" | "headers" | "method"> & {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  retryOnUnauthorized?: boolean;
};

type RefreshResponse = {
  accessToken: string;
  refreshToken: string;
};

let refreshPromise: Promise<boolean> | null = null;

export async function apiRequest<TResponse>(endpoint: string, options: ApiRequestOptions = {}): Promise<TResponse> {
  const retryOnUnauthorized = options.retryOnUnauthorized ?? true;

  if (options.auth && !getAccessToken()) {
    const refreshed = await refreshAccessToken();

    if (!refreshed) {
      throw new ApiError("Sign in required.", {
        endpoint,
        status: 401,
      });
    }
  }

  const response = await fetch(buildApiUrl(endpoint), createRequestInit(options));

  if (response.status === 401 && options.auth && retryOnUnauthorized) {
    const refreshed = await refreshAccessToken();

    if (refreshed) {
      return apiRequest<TResponse>(endpoint, {
        ...options,
        retryOnUnauthorized: false,
      });
    }
  }

  return parseApiResponse<TResponse>(response, endpoint);
}

function createRequestInit(options: ApiRequestOptions): RequestInit {
  const { auth, body, headers: optionHeaders, method = "GET", retryOnUnauthorized, ...requestOptions } = options;
  const headers = new Headers(optionHeaders);
  const init: RequestInit = {
    ...requestOptions,
    headers,
    method,
  };

  void retryOnUnauthorized;

  if (auth) {
    const accessToken = getAccessToken();

    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }

  if (body !== undefined) {
    if (isFormData(body)) {
      init.body = body;
    } else {
      headers.set("Content-Type", "application/json");
      init.body = JSON.stringify(body);
    }
  }

  return init;
}

async function parseApiResponse<TResponse>(response: Response, endpoint: string): Promise<TResponse> {
  const body = await readResponseBody(response);

  if (!response.ok) {
    throw new ApiError(
      extractApiErrorMessage(body, response.status === 401 ? "Sign in required." : "The request could not be completed."),
      {
        body,
        endpoint,
        status: response.status,
      },
    );
  }

  return body as TResponse;
}

async function refreshAccessToken() {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = requestRefreshToken().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function requestRefreshToken() {
  const refreshToken = getRefreshToken();

  if (!refreshToken) {
    clearStoredSession();
    return false;
  }

  try {
    const response = await fetch(buildApiUrl("/auth/refresh"), {
      body: JSON.stringify({ refreshToken }),
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
    });
    const body = await readResponseBody(response);

    if (!response.ok || !isRefreshResponse(body)) {
      clearStoredSession();
      return false;
    }

    setSessionTokens(body);
    return true;
  } catch {
    clearStoredSession();
    return false;
  }
}

async function readResponseBody(response: Response) {
  if (response.status === 204) {
    return undefined;
  }

  const text = await response.text();

  if (!text) {
    return undefined;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
}

function buildApiUrl(endpoint: string) {
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!apiBaseUrl) {
    throw new ApiError("Missing NEXT_PUBLIC_API_BASE_URL.", {
      endpoint,
    });
  }

  const baseUrl = apiBaseUrl.replace(/\/+$/, "");
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  return `${baseUrl}${normalizedEndpoint}`;
}

function isRefreshResponse(body: unknown): body is RefreshResponse {
  return (
    typeof body === "object" &&
    body !== null &&
    "accessToken" in body &&
    "refreshToken" in body &&
    typeof body.accessToken === "string" &&
    typeof body.refreshToken === "string"
  );
}

function isFormData(body: unknown): body is FormData {
  return typeof FormData !== "undefined" && body instanceof FormData;
}
