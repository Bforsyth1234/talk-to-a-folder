"use client";

import React, { useState, useEffect, useRef } from 'react';
import './Timer.css';

const Timer = () => {
  const [time, setTime] = useState(0); // time in seconds
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTime(prevTime => prevTime + 1);
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
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
  };

  return (
    <div className="timer-container">
      <div className="timer-display">
        {formatTime(time)}
      </div>
      <div className="timer-controls">
        {!isRunning ? (
          <button onClick={handleStart} className="timer-btn start-btn">
            Start
          </button>
        ) : (
          <button onClick={handleStop} className="timer-btn stop-btn">
            Stop
          </button>
        )}
        <button onClick={handleReset} className="timer-btn reset-btn">
          Reset
        </button>
      </div>
    </div>
  );
};

export default Timer;
