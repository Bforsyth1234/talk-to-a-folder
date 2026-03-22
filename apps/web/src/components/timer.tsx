"use client";

import { useTimer } from "@/lib/use-timer";

export function Timer() {
  const { formattedTime, isRunning, toggle, reset } = useTimer();

  return (
    <div className="flex items-center gap-3 rounded-lg bg-white/10 px-4 py-2 backdrop-blur-sm">
      <div className="font-mono text-lg font-semibold">{formattedTime}</div>
      <div className="flex gap-2">
        <button
          onClick={toggle}
          className="rounded-md bg-white/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/30"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={reset}
          className="rounded-md bg-white/20 px-3 py-1 text-sm font-medium transition-colors hover:bg-white/30"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
