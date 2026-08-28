import { apiRequest } from "./api-client";
import type { CurrentUser, UserRole } from "./session-service";

export type UserDirectoryItem = Pick<
  CurrentUser,
  "id" | "email" | "fullName" | "role"
> & { phone?: string; isActive?: boolean };
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

export async function listUsers(params: ListUsersParams = {}) {
  const query = new URLSearchParams();
  if (params.role) query.set("role", params.role);
  if (params.search) query.set("search", params.search);
  if (params.page) query.set("page", String(params.page));
  if (params.limit) query.set("limit", String(params.limit));
  const response = await apiRequest<UsersResponse>(
    `/auth/users${query.size ? `?${query}` : ""}`,
    { auth: true },
  );
  if (Array.isArray(response)) return response;
  return response.users || response.data || [];
}
