import { apiRequest } from "./api-client";
import type { CurrentUser, UserRole } from "./session-service";

export type UserDirectoryItem = Pick<
  CurrentUser,
  "id" | "email" | "fullName" | "role"
> & { phone?: string; isActive?: boolean; createdAt?: string; updatedAt?: string };
export type ListUsersParams = {
  role?: UserRole;
  search?: string;
  page?: number;
  limit?: number;
};
type UsersResponse =
  | UserDirectoryItem[]
  | {
      users?: UserDirectoryItem[];
      data?: UserDirectoryItem[];
      pagination?: unknown;
    };

export type UsersPage = {
  users: UserDirectoryItem[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
};

export async function listUsers(params: ListUsersParams = {}) {
  return (await listUsersPage(params)).users;
}

export async function listUsersPage(params: ListUsersParams = {}): Promise<UsersPage> {
  const query = new URLSearchParams();
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const response = await apiRequest<UsersResponse>(
    `/auth/users${query.size ? `?${query}` : ""}`,
    { auth: true },
  );
  if (Array.isArray(response)) return { users: response, pagination: { total: response.length, page: 1, limit: response.length, totalPages: 1 } };
  const users = response.users || response.data || [];
  const raw = response.pagination as Partial<UsersPage["pagination"]> | undefined;
  const limit = raw?.limit || params.limit || 20;
  const total = raw?.total ?? users.length;
  return { users, pagination: { total, page: raw?.page || params.page || 1, limit, totalPages: raw?.totalPages || Math.max(1, Math.ceil(total / limit)) } };
}

export type UpdateUserPayload = { fullName?: string; phone?: string; role?: UserRole; isActive?: boolean; password?: string };
export function getUser(id: string) { return apiRequest<UserDirectoryItem>(`/auth/users/${id}`, { auth: true }); }
export function updateUser(id: string, payload: UpdateUserPayload) { return apiRequest<{ message?: string; user: UserDirectoryItem }>(`/auth/users/${id}`, { auth: true, method: "PATCH", body: payload }); }
export function deactivateUser(id: string) { return apiRequest<{ message?: string; user: UserDirectoryItem }>(`/auth/users/${id}/deactivate`, { auth: true, method: "PATCH" }); }
export function reactivateUser(id: string) { return apiRequest<{ message?: string; user: UserDirectoryItem }>(`/auth/users/${id}/reactivate`, { auth: true, method: "PATCH" }); }
