"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SignInButton } from "@/components/sign-in-button";
import { TodoList } from "@/components/TodoList";

export default function Home() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-blue-600 px-4 py-3 text-white shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📁</span>
            <h1 className="text-xl font-semibold">Talk to a Folder</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-col items-center justify-center px-4 py-12">
        {!session ? (
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
                📁
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                Welcome
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                Chat with your Google Drive folder contents using AI-powered search
                and retrieval.
              </p>
            </div>

            <div className="flex flex-col items-center gap-4">
              <SignInButton />
              <p className="text-xs text-gray-400">
                Sign in with your Google account to get started.
                <br />
                We only request read-only access to your Drive.
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg">
            <div className="flex flex-col items-center gap-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <p className="text-gray-600">Redirecting to dashboard...</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

