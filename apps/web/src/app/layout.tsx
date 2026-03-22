import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talk to a Folder",
  description: "Chat with your Google Drive folder contents",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          <header className="bg-blue-500 text-white shadow-sm">
            <div className="container mx-auto px-4">
              <div className="flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 text-xl font-bold">
                  📁 Talk to a Folder
                </Link>
                <nav className="flex items-center gap-6">
                  <Link 
                    href="/todos" 
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Todos
                  </Link>
                  <Link 
                    href="/dashboard" 
                    className="rounded-md px-3 py-2 text-sm font-medium hover:bg-blue-600 transition-colors"
                  >
                    Dashboard
                  </Link>
                </nav>
              </div>
            </div>
          </header>
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

