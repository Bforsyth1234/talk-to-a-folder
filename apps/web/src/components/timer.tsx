"use client";

import { useState, useEffect, useRef } from "react";

interface TimerProps {
  className?: string;
}

export function Timer({ className = "" }: TimerProps) {
  const [time, setTime] = useState(0); // time in milliseconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 10);
      }, 10);
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

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setTime(0);
    setIsRunning(false);
  };

  const formatTime = (milliseconds: number): string => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col items-center gap-4 p-6 bg-white rounded-lg shadow-lg ${className}`}>
      <div className="text-4xl font-mono font-bold text-gray-800">
        {formatTime(time)}
      </div>
      <div className="flex gap-3">
        <button 
          onClick={handleStart} 
          disabled={isRunning}
          className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Start
        </button>
        <button 
          onClick={handleStop} 
          disabled={!isRunning}
          className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Stop
        </button>
        <button 
          onClick={handleReset}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
