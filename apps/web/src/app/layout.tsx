import type { Metadata } from "next";
import type { ReactNode } from "react";
import { useAuth } from "./lib/auth-context";
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
          {({ session }) => (
            <header className="bg-blue-500 text-white">
              {children}
              {session && <TodoList />}
            </header>
          )}
        </Providers>
      </body>
    </html>
  );
}

