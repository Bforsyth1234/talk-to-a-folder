"use client";

import { useState, useEffect, useRef } from "react";

interface TimerProps {
  className?: string;
}

export function Timer({ className = "" }: TimerProps) {
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => prevTime + 1);
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

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className={`flex items-center gap-4 rounded-lg bg-white px-4 py-2 shadow-sm ${className}`}>
      <div className="font-mono text-lg font-semibold text-gray-800">
        {formatTime(time)}
      </div>
      <div className="flex gap-2">
        {!isRunning ? (
          <button
            onClick={handleStart}
            className="rounded bg-blue-500 px-3 py-1 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Start
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="rounded bg-yellow-500 px-3 py-1 text-sm font-medium text-white hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2"
          >
            Pause
          </button>
        )}
        <button
          onClick={handleReset}
          className="rounded bg-gray-500 px-3 py-1 text-sm font-medium text-white hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
