import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import Timer from "@/components/Timer/Timer";
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
          <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <h1 className="text-xl font-semibold">Talk to a Folder</h1>
            </div>
            <Timer />
          </header>
          <main>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}

