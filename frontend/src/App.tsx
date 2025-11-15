/**
 * Main App Component
 * Handles routing between Lobby and Game views
 */

import React, { useState, useEffect } from 'react';
import { NakamaProvider, useNakama } from './contexts/NakamaContext';
import { useMatchmaking } from './hooks/useMatchmaking';
import { useGameState } from './hooks/useGameState';
import { Lobby, GameBoard, MatchStatus, Timer } from './components';
import { MatchmakingState, MatchState, GameResult } from './types';

/**
 * Game View Component
 */
function GameView() {
  const { session } = useNakama();
  const { matchId, matchmakingState, reset: resetMatchmaking } = useMatchmaking();
  const { gameState, isLoading, error, makeMove, reset: resetGame } = useGameState(matchId);
  const [showLobby, setShowLobby] = useState(false);

  const currentUserId = session?.user_id || null;
  
  // Debug: Log whenever gameState prop changes
  useEffect(() => {
    console.log('🔄 GameView: gameState prop changed:', gameState);
    console.log('🔄 GameView: moveCount:', gameState?.moveCount);
    console.log('🔄 GameView: board:', gameState?.board);
  }, [gameState]);

  /**
   * Reset and return to lobby
   */
  const handleReturnToLobby = () => {
    resetGame();
    resetMatchmaking();
    setShowLobby(true);
  };

  /**
   * Handle cell click
   */
  const handleCellClick = async (row: number, col: number) => {
    console.log('App.tsx: handleCellClick called', { row, col, matchId });
    if (!matchId) {
      console.log('App.tsx: No matchId, aborting');
      return;
    }
    console.log('App.tsx: Calling makeMove');
    await makeMove(row, col);
    console.log('App.tsx: makeMove completed');
  };

  /**
   * Check if game is finished
   */
  const isGameFinished = gameState?.state === MatchState.FINISHED;

  /**
   * Auto-return to lobby after game finishes
   */
  useEffect(() => {
    if (isGameFinished) {
      const timer = setTimeout(() => {
        handleReturnToLobby();
      }, 5000); // Return to lobby after 5 seconds

      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isGameFinished]);

  /**
   * Show lobby if no match or matchmaking is not matched
   */
  if (showLobby || !matchId || matchmakingState !== MatchmakingState.MATCHED) {
    return <Lobby />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl font-bold text-gray-800">Tic-Tac-Toe</h1>
          <button
            onClick={handleReturnToLobby}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
          >
            Leave Game
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Match Status */}
        <MatchStatus gameState={gameState} currentUserId={currentUserId} />

        {/* Timer */}
        {gameState && gameState.state === MatchState.PLAYING && (
          <Timer gameState={gameState} moveTimeout={30} />
        )}

        {/* Game Board */}
        <GameBoard
          key={gameState ? `board-${gameState.moveCount}-${JSON.stringify(gameState.board)}` : 'board-no-state'}
          gameState={gameState}
          currentUserId={currentUserId}
          onCellClick={handleCellClick}
          disabled={isLoading || !gameState || gameState.state !== MatchState.PLAYING}
        />

        {/* Game Over Message */}
        {isGameFinished && (
          <div className="mt-6 text-center">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">
                {gameState.result === GameResult.X_WINS && gameState.players.X?.userId === currentUserId && 'You Win! 🎉'}
                {gameState.result === GameResult.O_WINS && gameState.players.O?.userId === currentUserId && 'You Win! 🎉'}
                {gameState.result === GameResult.X_WINS && gameState.players.X?.userId !== currentUserId && 'You Lose 😢'}
                {gameState.result === GameResult.O_WINS && gameState.players.O?.userId !== currentUserId && 'You Lose 😢'}
                {gameState.result === GameResult.DRAW && "It's a Draw! 🤝"}
              </h2>
              <p className="text-gray-600 mb-4">Returning to lobby in 5 seconds...</p>
              <button
                onClick={handleReturnToLobby}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center mt-4">
            <div className="inline-flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span>Processing move...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Main App Component
 */
function AppContent() {
  return <GameView />;
}

/**
 * App Component with Nakama Provider
 */
export default function App() {
  return (
    <NakamaProvider>
      <AppContent />
    </NakamaProvider>
  );
}

