"use client";

import type { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider } from "@/lib/auth-context";

const GOOGLE_CLIENT_ID =
  process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] ?? "";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthProvider>{children}</AuthProvider>
    </GoogleOAuthProvider>
  );
}

