import { apiRequest } from "./api-client";
import { ApiError } from "./api-errors";
import {
  clearStoredSession,
  getStoredCurrentUser,
  hasStoredSession,
  saveCurrentUser,
  saveSession,
  setSessionTokens,
  type AuthenticatedSession,
  type CurrentUser,
  type SessionTokens,
  type UserRole,
} from "./session-service";

export type LoginCredentials = {
  email: string;
  password: string;
};

export type RegisterUserPayload = {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
  phone?: string;
};

export type RegisterUserResponse = {
  message?: string;
  user?: CurrentUser;
};

export type LoginResponse = SessionTokens & {
  message: string;
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
};

export async function login(credentials: LoginCredentials): Promise<AuthenticatedSession> {
  const loginResponse = await apiRequest<LoginResponse>("/auth/login", {
    body: credentials,
    method: "POST",
    retryOnUnauthorized: false,
  });

  if (!isLoginResponse(loginResponse)) {
    throw new ApiError("Unexpected login response from server.", {
      endpoint: "/auth/login",
    });
  }

  setSessionTokens({
    accessToken: loginResponse.accessToken,
    refreshToken: loginResponse.refreshToken,
  });

  const user = await getCurrentUser();
  const session = {
    accessToken: loginResponse.accessToken,
    refreshToken: loginResponse.refreshToken,
    user,
  };

  saveSession(session);
  return session;
}

export async function getCurrentUser() {
  return apiRequest<CurrentUser>("/auth/me", {
    auth: true,
    method: "GET",
  });
}

export function registerUser(payload: RegisterUserPayload) {
  return apiRequest<RegisterUserResponse>("/auth/register", {
    body: payload,
    method: "POST",
    retryOnUnauthorized: false,
  });
}

export async function restoreSession() {
  if (!hasStoredSession()) {
    clearStoredSession();
    return null;
  }

  try {
    const user = await getCurrentUser();
    saveCurrentUser(user);
    return user;
  } catch {
    clearStoredSession();
    return null;
  }
}

export function getCachedCurrentUser() {
  return getStoredCurrentUser();
}

export function logoutLocal() {
  clearStoredSession();
}

function isLoginResponse(response: unknown): response is LoginResponse {
  return (
    typeof response === "object" &&
    response !== null &&
    "accessToken" in response &&
    "refreshToken" in response &&
    typeof response.accessToken === "string" &&
    typeof response.refreshToken === "string"
  );
}
