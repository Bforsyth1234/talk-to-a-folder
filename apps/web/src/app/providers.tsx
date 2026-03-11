"use client";

import { useEffect, type ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/auth-context";

const GOOGLE_CLIENT_ID =
  process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] ?? "";

export function Providers({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      console.error(
        "Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID. Set it on the web app and redeploy before using Google sign-in.",
      );
    }
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return <AuthProvider>{children}</AuthProvider>;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}

