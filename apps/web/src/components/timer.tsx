"use client";

import React, { useState, useEffect, useRef } from 'react';

const Timer = () => {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

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
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handlePause = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
  };

  return (
    <div className="flex flex-col items-center p-5 border border-gray-300 rounded-lg bg-gray-50 my-5 max-w-xs mx-auto">
      <div className="text-4xl font-bold font-mono text-gray-800 mb-5 min-w-[120px] text-center">
        {formatTime(seconds)}
      </div>
      <div className="flex gap-2.5">
        {!isRunning ? (
          <button 
            onClick={handleStart} 
            className="px-5 py-2.5 border-none rounded bg-green-500 text-white text-base cursor-pointer transition-colors duration-300 hover:bg-green-600"
          >
            Start
          </button>
        ) : (
          <button 
            onClick={handlePause} 
            className="px-5 py-2.5 border-none rounded bg-orange-500 text-white text-base cursor-pointer transition-colors duration-300 hover:bg-orange-600"
          >
            Pause
          </button>
        )}
        <button 
          onClick={handleReset} 
          className="px-5 py-2.5 border-none rounded bg-red-500 text-white text-base cursor-pointer transition-colors duration-300 hover:bg-red-600"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;
