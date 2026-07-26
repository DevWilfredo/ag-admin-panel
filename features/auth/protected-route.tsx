"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { restoreSession } from "@/services/auth-service";

type AuthStatus = "checking" | "authenticated";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [status, setStatus] = useState<AuthStatus>("checking");

  useEffect(() => {
    let mounted = true;

    async function verifySession() {
      const user = await restoreSession();

      if (!mounted) {
        return;
      }

      if (!user) {
        router.replace("/");
        return;
      }

      setStatus("authenticated");
    }

    void verifySession();

    return () => {
      mounted = false;
    };
  }, [router]);

  if (status === "checking") {
    return <AuthCheckingScreen />;
  }

  return <>{children}</>;
}

function AuthCheckingScreen() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f1f1f1] px-4 text-center">
      <div>
        <div
          className="mx-auto flex h-20 w-20 items-center justify-center rounded-[8px] shadow-[0_18px_48px_rgba(0,28,66,0.18)]"
          style={{ background: "linear-gradient(270deg, #164780 0%, #001C42 100%)" }}
        >
          <Image alt="AgroTrust" className="h-8 w-8 object-contain" height={32} priority src="/agrotrust-logo.svg" width={32} />
        </div>
        <p className="mt-5 text-[14px] font-semibold leading-[21px] text-[#303034]">Checking session</p>
      </div>
    </main>
  );
}
