"use client";

import { useRouter } from "next/navigation";
import { logout, logoutLocal } from "@/services/auth-service";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  function handleLogout() {
    const remoteLogout = logout();
    logoutLocal();
    router.replace("/");
    void remoteLogout.catch(() => undefined);
  }

  return (
    <button className={className} onClick={handleLogout} type="button">
      Log out
    </button>
  );
}
