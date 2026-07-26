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
    return error.message || fallback;
  }

  if (error instanceof Error) {
    return error.message || fallback;
  }

  return fallback;
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
