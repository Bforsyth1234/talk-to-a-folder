import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talk to a Folder",
  description: "Chat with your Google Drive folder contents",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-purple-50 text-gray-900 antialiased">
        <Providers>
          <header className="bg-purple-600 text-white">
            {children}
          </header>
        </Providers>
      </body>
    </html>
  );
}

