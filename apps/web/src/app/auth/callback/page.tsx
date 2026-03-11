"use client";

import { Suspense, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { handleAuthCallback, session } = useAuth();
  const calledRef = useRef(false);

  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !calledRef.current) {
      calledRef.current = true;
      void handleAuthCallback(code, window.location.origin + "/auth/callback");
    }
  }, [searchParams, handleAuthCallback]);

  useEffect(() => {
    if (session) {
      router.replace("/");
    }
  }, [session, router]);

  return <p>Completing sign-in…</p>;
}

export default function AuthCallbackPage() {
  return (
    <main
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: "100vh",
      }}
    >
      <Suspense fallback={<p>Loading…</p>}>
        <CallbackHandler />
      </Suspense>
    </main>
  );
}

