import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import { Timer } from "@/components/timer";
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
          <header className="bg-blue-500 text-white">
            <div className="container mx-auto flex items-center justify-between px-4 py-3">
              <h1 className="text-xl font-semibold">Talk to a Folder</h1>
              <Timer />
            </div>
          </header>
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  );
}

