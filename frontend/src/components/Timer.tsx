/**
 * Timer Component
 * Displays countdown timer for timed mode
 */

import React, { useState, useEffect } from 'react';
import { GameState, MatchState } from '../types';

interface TimerProps {
  gameState: GameState | null;
  moveTimeout?: number; // Timeout in seconds (default 30)
}

/**
 * Timer Component
 */
export function Timer({ gameState, moveTimeout = 30 }: TimerProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(moveTimeout);
  const [warning, setWarning] = useState<boolean>(false);

  useEffect(() => {
    if (!gameState || gameState.state !== MatchState.PLAYING) {
      setTimeRemaining(moveTimeout);
      setWarning(false);
      return;
    }

    // Reset timer when lastMoveTime changes (new move made)
    // This ensures the timer resets after every turn
    const resetTimer = () => {
      setTimeRemaining(moveTimeout);
      setWarning(false);
    };

    // Calculate time remaining based on lastMoveTime
    const updateTimer = () => {
      const now = Date.now();
      const elapsed = (now - gameState.lastMoveTime) / 1000; // Convert to seconds
      const remaining = Math.max(0, moveTimeout - elapsed);
      setTimeRemaining(remaining);
      setWarning(remaining <= 10 && remaining > 0);
    };

    // Reset immediately when lastMoveTime changes
    resetTimer();

    // Update immediately
    updateTimer();

    // Update every second
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
    // Depend on lastMoveTime to reset timer when it changes
  }, [gameState?.lastMoveTime, gameState?.state, moveTimeout]);

  if (!gameState || gameState.state !== MatchState.PLAYING) {
    return null;
  }

  /**
   * Get timer color based on time remaining
   */
  const getTimerColor = (): string => {
    if (timeRemaining <= 5) return 'text-red-600';
    if (timeRemaining <= 10) return 'text-yellow-600';
    return 'text-gray-600';
  };

  /**
   * Get timer background color
   */
  const getTimerBgColor = (): string => {
    if (timeRemaining <= 5) return 'bg-red-100';
    if (timeRemaining <= 10) return 'bg-yellow-100';
    return 'bg-gray-100';
  };

  /**
   * Format time remaining
   */
  const formatTime = (seconds: number): string => {
    return Math.ceil(seconds).toString();
  };

  /**
   * Get progress percentage
   */
  const getProgress = (): number => {
    return (timeRemaining / moveTimeout) * 100;
  };

  return (
    <div className={`${getTimerBgColor()} rounded-lg p-4 mb-4 transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Time Remaining</span>
        <span className={`text-2xl font-bold ${getTimerColor()}`}>
          {formatTime(timeRemaining)}s
        </span>
      </div>
      
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${
            timeRemaining <= 5 ? 'bg-red-500' : timeRemaining <= 10 ? 'bg-yellow-500' : 'bg-blue-500'
          }`}
          style={{ width: `${getProgress()}%` }}
        ></div>
      </div>

      {/* Warning Message */}
      {warning && timeRemaining > 0 && (
        <div className="mt-2 text-center text-sm text-yellow-700 font-medium">
          ⏰ Time running out!
        </div>
      )}

      {timeRemaining === 0 && (
        <div className="mt-2 text-center text-sm text-red-700 font-medium">
          ⏱️ Time's up!
        </div>
      )}
    </div>
  );
}

