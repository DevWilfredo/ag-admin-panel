"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { CurrentUser } from "@/services/session-service";

const AuthenticatedUserContext = createContext<CurrentUser | null>(null);

export function AuthenticatedUserProvider({
  children,
  user,
}: {
  children: ReactNode;
  user: CurrentUser;
}) {
  return (
    <AuthenticatedUserContext.Provider value={user}>
      {children}
    </AuthenticatedUserContext.Provider>
  );
}

export function useAuthenticatedUser() {
  return useContext(AuthenticatedUserContext);
}
