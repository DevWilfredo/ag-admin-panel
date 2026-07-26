export type UserRole = "ADMIN" | "PRODUCER" | "BUYER" | "LENDER" | "WAREHOUSE_KEEPER";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

export type SessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthenticatedSession = SessionTokens & {
  user: CurrentUser;
};

const refreshTokenKey = "agrotrust.refreshToken";
const currentUserKey = "agrotrust.currentUser";

let accessTokenMemory: string | null = null;

export function getAccessToken() {
  return accessTokenMemory;
}

export function getRefreshToken() {
  return readStorageItem(refreshTokenKey);
}

export function setSessionTokens(tokens: SessionTokens) {
  accessTokenMemory = tokens.accessToken;
  writeStorageItem(refreshTokenKey, tokens.refreshToken);
}

export function saveSession(session: AuthenticatedSession) {
  setSessionTokens({
    accessToken: session.accessToken,
    refreshToken: session.refreshToken,
  });
  saveCurrentUser(session.user);
}

export function saveCurrentUser(user: CurrentUser) {
  writeStorageItem(currentUserKey, JSON.stringify(user));
}

export function getStoredCurrentUser(): CurrentUser | null {
  const rawUser = readStorageItem(currentUserKey);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as CurrentUser;
  } catch {
    removeStorageItem(currentUserKey);
    return null;
  }
}

export function hasStoredSession() {
  return Boolean(accessTokenMemory || getRefreshToken());
}

export function clearStoredSession() {
  accessTokenMemory = null;
  removeStorageItem(refreshTokenKey);
  removeStorageItem(currentUserKey);
}

function readStorageItem(key: string) {
  if (!canUseSessionStorage()) {
    return null;
  }

  return window.sessionStorage.getItem(key);
}

function writeStorageItem(key: string, value: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.setItem(key, value);
}

function removeStorageItem(key: string) {
  if (!canUseSessionStorage()) {
    return;
  }

  window.sessionStorage.removeItem(key);
}

function canUseSessionStorage() {
  return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}
