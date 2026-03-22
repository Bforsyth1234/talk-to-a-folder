"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Providers } from "./providers";
import Timer from "@/components/Timer/Timer";
import "./globals.css";

// Routes that have their own headers and shouldn't show the root header
const ROUTES_WITH_CUSTOM_HEADERS = ['/dashboard', '/eval'];

export default function RootLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const shouldShowHeader = !ROUTES_WITH_CUSTOM_HEADERS.some(route => 
    pathname.startsWith(route)
  );
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {shouldShowHeader && (
            <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">Talk to a Folder</h1>
              </div>
              <Timer />
            </header>
          )}
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

