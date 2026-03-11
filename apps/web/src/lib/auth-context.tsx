"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session } from "@talk-to-a-folder/shared";

const SESSION_KEY = "talk-to-a-folder:session";

interface AuthState {
  session: Session | null;
  isLoading: boolean;
}

interface AuthContextValue extends AuthState {
  /** Called after the Google OAuth redirect returns an authorization code. */
  handleAuthCallback: (code: string, redirectUri?: string) => Promise<void>;
  /** Sign out and clear session. */
  signOut: () => void;
  /** Convenience accessor – the Google access token for backend calls. */
  accessToken: string | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const API_BASE = process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001";
const POPUP_REDIRECT_URI = "postmessage";

function loadSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (new Date(session.expiresAt) < new Date()) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSession(session: Session | null) {
  if (typeof window === "undefined") return;
  if (session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } else {
    localStorage.removeItem(SESSION_KEY);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    isLoading: true,
  });

  // Hydrate from localStorage on mount, then validate against the backend.
  useEffect(() => {
    const saved = loadSession();
    if (!saved) {
      setState({ session: null, isLoading: false });
      return;
    }

    // Optimistically show the saved session while we verify it.
    setState({ session: saved, isLoading: true });

    fetch(`${API_BASE}/auth/me`, {
      headers: { Authorization: `Bearer ${saved.googleToken.accessToken}` },
    })
      .then((res) => {
        if (res.ok) {
          // Backend still knows this session – keep it.
          setState({ session: saved, isLoading: false });
        } else {
          // Backend rejected – clear stale session.
          saveSession(null);
          setState({ session: null, isLoading: false });
        }
      })
      .catch(() => {
        // Network error – clear to be safe.
        saveSession(null);
        setState({ session: null, isLoading: false });
      });
  }, []);

  const handleAuthCallback = useCallback(
    async (code: string, redirectUri = POPUP_REDIRECT_URI) => {
      setState((s) => ({ ...s, isLoading: true }));
      try {
        const res = await fetch(`${API_BASE}/auth/callback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, redirectUri }),
        });
        if (!res.ok) {
          throw new Error(`Auth callback failed: ${res.status}`);
        }
        const data = (await res.json()) as { session: Session };
        saveSession(data.session);
        setState({ session: data.session, isLoading: false });
      } catch (err) {
        console.error("Auth callback error:", err);
        setState({ session: null, isLoading: false });
      }
    },
    [],
  );

  const signOut = useCallback(() => {
    saveSession(null);
    setState({ session: null, isLoading: false });
  }, []);

  const accessToken = state.session?.googleToken.accessToken ?? null;

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      handleAuthCallback,
      signOut,
      accessToken,
    }),
    [state, handleAuthCallback, signOut, accessToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}

