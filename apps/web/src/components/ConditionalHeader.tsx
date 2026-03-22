"use client";

import { usePathname } from "next/navigation";
import Timer from "@/components/Timer/Timer";

// Routes that have their own headers and shouldn't show the root header
const ROUTES_WITH_CUSTOM_HEADERS = ['/dashboard', '/eval'];

export default function ConditionalHeader() {
  const pathname = usePathname();
  const shouldShowHeader = !ROUTES_WITH_CUSTOM_HEADERS.some(route => 
    pathname.startsWith(route)
  );

  if (!shouldShowHeader) {
    return null;
  }

  return (
    <header className="bg-blue-500 text-white p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold">Talk to a Folder</h1>
      </div>
      <Timer />
    </header>
  );
}
