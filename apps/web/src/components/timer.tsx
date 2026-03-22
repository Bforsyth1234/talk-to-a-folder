"use client";

import { useState, useEffect, useRef } from "react";

interface TimerState {
  time: number; // seconds
  isRunning: boolean;
  isPaused: boolean;
}

export function Timer() {
  const [state, setState] = useState<TimerState>({
    time: 0,
    isRunning: false,
    isPaused: false,
  });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const start = () => {
    if (!state.isRunning) {
      setState(prev => ({ ...prev, isRunning: true, isPaused: false }));
    }
  };

  const pause = () => {
    if (state.isRunning && !state.isPaused) {
      setState(prev => ({ ...prev, isPaused: true }));
    }
  };

  const resume = () => {
    if (state.isPaused) {
      setState(prev => ({ ...prev, isPaused: false }));
    }
  };

  const stop = () => {
    setState(prev => ({ ...prev, isRunning: false, isPaused: false }));
  };

  const reset = () => {
    setState({ time: 0, isRunning: false, isPaused: false });
  };

  // Effect to handle the timer interval
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      intervalRef.current = setInterval(() => {
        setState(prev => ({ ...prev, time: prev.time + 1 }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [state.isRunning, state.isPaused]);

  return (
    <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-2 shadow-sm">
      {/* Timer Display */}
      <div className="font-mono text-lg font-semibold text-gray-900 min-w-[4rem]">
        {formatTime(state.time)}
      </div>

      {/* Timer Controls */}
      <div className="flex gap-1">
        {!state.isRunning ? (
          <button
            onClick={start}
            className="rounded-md bg-green-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
            title="Start timer"
          >
            ▶️
          </button>
        ) : state.isPaused ? (
          <button
            onClick={resume}
            className="rounded-md bg-blue-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-blue-700"
            title="Resume timer"
          >
            ▶️
          </button>
        ) : (
          <button
            onClick={pause}
            className="rounded-md bg-yellow-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-yellow-700"
            title="Pause timer"
          >
            ⏸️
          </button>
        )}

        <button
          onClick={stop}
          disabled={!state.isRunning}
          className="rounded-md bg-red-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          title="Stop timer"
        >
          ⏹️
        </button>

        <button
          onClick={reset}
          className="rounded-md bg-gray-600 px-2 py-1 text-xs font-medium text-white transition-colors hover:bg-gray-700"
          title="Reset timer"
        >
          🔄
        </button>
      </div>
    </div>
  );
}
