/**
 * MatchStatus Component
 * Displays current match status, players, and game result
 */

import React from 'react';
import { GameState, MatchState, GameResult, PlayerSymbol, ConnectionState } from '../types';
import { useNakama } from '../contexts/NakamaContext';

interface MatchStatusProps {
  gameState: GameState | null;
  currentUserId: string | null;
}

/**
 * MatchStatus Component
 */
export function MatchStatus({ gameState, currentUserId }: MatchStatusProps) {
  const { connectionState } = useNakama();

  if (!gameState) {
    return null;
  }

  const playerX = gameState.players.X;
  const playerO = gameState.players.O;
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const isMyTurn = currentPlayer?.userId === currentUserId;
  const isPlaying = gameState.state === MatchState.PLAYING;

  /**
   * Get status message
   */
  const getStatusMessage = (): string => {
    if (gameState.state === MatchState.WAITING) {
      return 'Waiting for opponent...';
    }

    if (gameState.state === MatchState.FINISHED) {
      switch (gameState.result) {
        case GameResult.X_WINS:
          return playerX?.userId === currentUserId ? 'You Win! 🎉' : 'You Lose 😢';
        case GameResult.O_WINS:
          return playerO?.userId === currentUserId ? 'You Win! 🎉' : 'You Lose 😢';
        case GameResult.DRAW:
          return "It's a Draw! 🤝";
        default:
          return 'Game Over';
      }
    }

    if (gameState.state === MatchState.ABANDONED) {
      return 'Opponent left the game';
    }

    if (isPlaying) {
      return isMyTurn ? "Your Turn" : "Opponent's Turn";
    }

    return 'Unknown status';
  };

  /**
   * Get status color
   */
  const getStatusColor = (): string => {
    if (gameState.state === MatchState.FINISHED) {
      if (
        (gameState.result === GameResult.X_WINS && playerX?.userId === currentUserId) ||
        (gameState.result === GameResult.O_WINS && playerO?.userId === currentUserId)
      ) {
        return 'text-green-600';
      }
      if (gameState.result === GameResult.DRAW) {
        return 'text-yellow-600';
      }
      return 'text-red-600';
    }

    if (isMyTurn && isPlaying) {
      return 'text-blue-600';
    }

    return 'text-gray-600';
  };

  /**
   * Get player display name
   */
  const getPlayerName = (player: { userId: string; username: string } | undefined): string => {
    if (!player) return 'Waiting...';
    return player.userId === currentUserId ? 'You' : player.username || 'Opponent';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Connection Status */}
      <div className="flex items-center justify-end mb-2">
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
          connectionState === ConnectionState.CONNECTED 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        }`}>
          <span className={`w-2 h-2 rounded-full mr-1 ${
            connectionState === ConnectionState.CONNECTED ? 'bg-green-500' : 'bg-yellow-500'
          }`}></span>
          {connectionState === ConnectionState.CONNECTED ? 'Connected' : 'Connecting'}
        </div>
      </div>

      {/* Players */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className={`text-center p-3 rounded-lg ${
          gameState.currentPlayer === 'X' && isPlaying ? 'bg-blue-100 border-2 border-blue-500' : 'bg-gray-50'
        }`}>
          <div className="text-sm font-medium text-gray-600">Player X</div>
          <div className="text-lg font-bold text-blue-600">{getPlayerName(playerX)}</div>
          {playerX && !playerX.present && (
            <div className="text-xs text-red-600 mt-1">Disconnected</div>
          )}
        </div>
        <div className={`text-center p-3 rounded-lg ${
          gameState.currentPlayer === 'O' && isPlaying ? 'bg-red-100 border-2 border-red-500' : 'bg-gray-50'
        }`}>
          <div className="text-sm font-medium text-gray-600">Player O</div>
          <div className="text-lg font-bold text-red-600">{getPlayerName(playerO)}</div>
          {playerO && !playerO.present && (
            <div className="text-xs text-red-600 mt-1">Disconnected</div>
          )}
        </div>
      </div>

      {/* Status Message */}
      <div className={`text-center text-xl font-bold ${getStatusColor()}`}>
        {getStatusMessage()}
      </div>

      {/* Move Count */}
      {isPlaying && (
        <div className="text-center text-sm text-gray-500 mt-2">
          Move {gameState.moveCount} of 9
        </div>
      )}
    </div>
  );
}

