"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SignInButton } from "@/components/sign-in-button";

export default function Home() {
  const { session } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (session) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="w-full max-w-md rounded-2xl bg-white p-10 shadow-lg">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-2xl text-white">
            📁
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Talk to a Folder
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Chat with your Google Drive folder contents using AI-powered search
            and retrieval.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <SignInButton />
          <div className="w-full border-t border-gray-200 pt-4">
            <Link 
              href="/todos"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-gray-300 bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
            >
              📝 Try the Todo List
            </Link>
          </div>
          <p className="text-xs text-gray-400">
            Sign in with your Google account to get started.
            <br />
            We only request read-only access to your Drive.
          </p>
        </div>
      </div>
    </main>
  );
}

