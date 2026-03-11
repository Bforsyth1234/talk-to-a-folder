"use client";

import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "@/lib/auth-context";

const GOOGLE_CLIENT_ID =
  process.env["NEXT_PUBLIC_GOOGLE_CLIENT_ID"] ?? "";

const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/drive.readonly",
].join(" ");

function ConfiguredSignInButton() {
  const { handleAuthCallback, isLoading } = useAuth();

  const login = useGoogleLogin({
    flow: "auth-code",
    ux_mode: "popup",
    scope: SCOPES,
    onSuccess: (response) => {
      void handleAuthCallback(response.code);
    },
    onError: (error) => {
      console.error("Google login error:", error);
    },
  });

  return (
    <button
      onClick={() => login()}
      disabled={isLoading}
      className={`inline-flex items-center gap-2.5 rounded-lg px-6 py-3 text-base font-medium text-white shadow-sm transition-colors ${
        isLoading
          ? "cursor-not-allowed bg-gray-400"
          : "cursor-pointer bg-blue-600 hover:bg-blue-700 active:bg-blue-800"
      }`}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path
          fill="#EA4335"
          d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        />
        <path
          fill="#4285F4"
          d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        />
        <path
          fill="#FBBC05"
          d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.001 24.001 0 0 0 0 21.56l7.98-6.19z"
        />
        <path
          fill="#34A853"
          d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        />
      </svg>
      {isLoading ? "Signing in…" : "Sign in with Google"}
    </button>
  );
}

export function SignInButton() {
  if (!GOOGLE_CLIENT_ID) {
    return (
      <div className="w-full rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Google sign-in is not configured. Set
        {" "}<code>NEXT_PUBLIC_GOOGLE_CLIENT_ID</code>{" "}
        on the Railway web service, then redeploy.
      </div>
    );
  }

  return <ConfiguredSignInButton />;
}

