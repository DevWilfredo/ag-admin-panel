export type ApiErrorOptions = {
  status?: number;
  body?: unknown;
  endpoint?: string;
};

export class ApiError extends Error {
  status?: number;
  body?: unknown;
  endpoint?: string;

  constructor(message: string, options: ApiErrorOptions = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status;
    this.body = options.body;
    this.endpoint = options.endpoint;
  }
}

export function getErrorMessage(error: unknown, fallback = "Something went wrong. Try again.") {
  if (error instanceof ApiError) {
    if (error.status === 401) return "Your session has expired. Please sign in again.";
    if (error.status === 403) return "You don’t have permission to perform this action.";
    if (error.status === 404) return "The requested information could not be found.";
    if (error.status && error.status >= 500) return "The service is temporarily unavailable. Please try again in a moment.";
    return humanize(error.message, fallback);
  }

  if (error instanceof Error) {
    return humanize(error.message, fallback);
  }

  return fallback;
}

function humanize(message: string | undefined, fallback: string) {
  if (!message) return fallback;
  if (/failed to fetch|networkerror|network request failed|load failed|econnrefused/i.test(message)) return "We couldn’t connect to the service. Check your connection and try again.";
  if (/NEXT_PUBLIC_API|base url|environment variable/i.test(message)) return "The service connection is not configured. Please contact support.";
  return message;
}

export function extractApiErrorMessage(body: unknown, fallback: string) {
  if (isRecord(body)) {
    const error = body.error;

    if (typeof error === "string" && error.trim()) {
      return error;
    }

    const message = body.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
