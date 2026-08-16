import { ProtectedRoute } from "@/features/auth/protected-route";
import { UsersClient } from "@/features/management/users-client";

export default function UsersPage() {
  return <ProtectedRoute capability="manage:users"><UsersClient /></ProtectedRoute>;
}
