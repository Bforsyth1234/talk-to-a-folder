"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SignInButton } from "@/components/sign-in-button";
import TodoList from "@/components/TodoList/TodoList";

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
          <p className="text-xs text-gray-400">
            Sign in with your Google account to get started.
            <br />
            We only request read-only access to your Drive.
          </p>
        </div>
      </div>

      {/* Demo Todo List */}
      <div className="mt-8 w-full max-w-2xl">
        <div className="mb-4 text-center">
          <h2 className="text-lg font-semibold text-gray-700">
            Try our Todo List Demo
          </h2>
          <p className="text-sm text-gray-500">
            A simple todo list with local storage persistence
          </p>
        </div>
        <TodoList />
      </div>
    </main>
  );
}

