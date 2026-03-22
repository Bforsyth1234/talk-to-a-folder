"use client";

import { useState, useEffect, useRef } from "react";

export function Timer() {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(prevSeconds => prevSeconds + 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number): string => {
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  return (
    <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-md">
      <div className="text-center">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">Timer</h2>
        <div className="mb-6 text-4xl font-mono font-bold text-blue-600">
          {formatTime(seconds)}
        </div>
        <div className="flex justify-center gap-2">
          <button
            onClick={handleStart}
            disabled={isRunning}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              isRunning
                ? "cursor-not-allowed bg-gray-400"
                : "bg-green-500 hover:bg-green-600 active:bg-green-700"
            }`}
          >
            Start
          </button>
          <button
            onClick={handleStop}
            disabled={!isRunning}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
              !isRunning
                ? "cursor-not-allowed bg-gray-400"
                : "bg-red-500 hover:bg-red-600 active:bg-red-700"
            }`}
          >
            Stop
          </button>
          <button
            onClick={handleReset}
            className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-600 active:bg-gray-700"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}
