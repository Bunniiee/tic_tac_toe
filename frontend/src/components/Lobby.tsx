/**
 * Lobby Component
 * Displays matchmaking status and handles finding matches
 */

import React from 'react';
import { useMatchmaking } from '../hooks/useMatchmaking';
import { MatchmakingState, ConnectionState } from '../types';
import { useNakama } from '../contexts/NakamaContext';

/**
 * Lobby Component
 */
export function Lobby() {
  const { matchmakingState, error, findMatch, cancelMatchmaking } = useMatchmaking();
  const { connectionState, isConnected } = useNakama();

  /**
   * Handle find match button click
   */
  const handleFindMatch = async () => {
    if (!isConnected) {
      return;
    }
    await findMatch();
  };

  /**
   * Handle cancel button click
   */
  const handleCancel = async () => {
    await cancelMatchmaking();
  };

  /**
   * Get status message
   */
  const getStatusMessage = (): string => {
    if (connectionState !== ConnectionState.CONNECTED) {
      return 'Connecting to server...';
    }

    switch (matchmakingState) {
      case MatchmakingState.IDLE:
        return 'Click "Find Match" to start searching for an opponent';
      case MatchmakingState.SEARCHING:
        return 'Searching for an opponent...';
      case MatchmakingState.MATCHED:
        return 'Match found! Starting game...';
      case MatchmakingState.ERROR:
        return error || 'An error occurred';
      default:
        return 'Ready to play';
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (): string => {
    switch (matchmakingState) {
      case MatchmakingState.SEARCHING:
        return 'text-blue-600';
      case MatchmakingState.MATCHED:
        return 'text-green-600';
      case MatchmakingState.ERROR:
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">Tic-Tac-Toe</h1>
        
        <div className="space-y-6">
          {/* Connection Status */}
          <div className="text-center">
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
            }`}>
              <span className={`w-2 h-2 rounded-full mr-2 ${
                isConnected ? 'bg-green-500' : 'bg-yellow-500'
              }`}></span>
              {isConnected ? 'Connected' : 'Connecting...'}
            </div>
          </div>

          {/* Status Message */}
          <div className={`text-center text-lg ${getStatusColor()}`}>
            {getStatusMessage()}
          </div>

          {/* Find Match Button */}
          <div className="flex flex-col space-y-3">
            {matchmakingState === MatchmakingState.IDLE && (
              <button
                onClick={handleFindMatch}
                disabled={!isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md hover:shadow-lg"
              >
                Find Match
              </button>
            )}

            {matchmakingState === MatchmakingState.SEARCHING && (
              <>
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                  <span className="text-gray-600">Searching...</span>
                </div>
                <button
                  onClick={handleCancel}
                  className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            )}

            {matchmakingState === MatchmakingState.ERROR && (
              <button
                onClick={handleFindMatch}
                disabled={!isConnected}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && matchmakingState === MatchmakingState.ERROR && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
        </div>

        {/* Game Instructions */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h2 className="text-lg font-semibold mb-2 text-gray-800">How to Play</h2>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Click "Find Match" to search for an opponent</li>
            <li>• Take turns placing X or O on the board</li>
            <li>• Get three in a row to win!</li>
            <li>• Each move has a 30-second time limit</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

