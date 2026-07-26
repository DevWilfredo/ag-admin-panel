"use client";

import { useRouter } from "next/navigation";
import { logoutLocal } from "@/services/auth-service";

export function LogoutButton({ className }: { className?: string }) {
  const router = useRouter();

  function handleLogout() {
    logoutLocal();
    router.replace("/");
  }

  return (
    <button className={className} onClick={handleLogout} type="button">
      Log out
    </button>
  );
}
