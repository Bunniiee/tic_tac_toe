/**
 * GameBoard Component
 * Renders the 3x3 grid and handles cell clicks
 */

import React from 'react';
import { GameState, PlayerSymbol, MatchState } from '../types';

interface GameBoardProps {
  gameState: GameState | null;
  currentUserId: string | null;
  onCellClick: (row: number, col: number) => void;
  disabled?: boolean;
}

/**
 * GameBoard Component
 */
export function GameBoard({ gameState, currentUserId, onCellClick, disabled }: GameBoardProps) {
  // Force re-render on every prop change
  const renderKey = gameState ? `${gameState.moveCount}-${JSON.stringify(gameState.board)}` : 'no-state';
  
  console.log('GameBoard render - renderKey:', renderKey);
  console.log('GameBoard render - gameState:', gameState);
  console.log('GameBoard render - gameState reference:', gameState ? 'exists' : 'null');
  
  if (!gameState) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-gray-500">Waiting for game state...</div>
      </div>
    );
  }

  const board = gameState.board;
  console.log('GameBoard render - board:', JSON.stringify(board));
  console.log('GameBoard render - moveCount:', gameState.moveCount);
  console.log('GameBoard render - currentPlayer:', gameState.currentPlayer);
  console.log('GameBoard render - board cells:', board.flat().filter(cell => cell !== '').length);
  const isPlaying = gameState.state === MatchState.PLAYING;
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const isMyTurn = currentPlayer?.userId === currentUserId && isPlaying;
  const winnerCells = gameState.winnerCells || [];
  
  // Debug: Log turn and disabled state
  console.log('🎮 GameBoard state:', {
    isPlaying,
    currentPlayerId: currentPlayer?.userId,
    currentUserId,
    isMyTurn,
    disabled,
    gameStateState: gameState.state
  });

  /**
   * Check if a cell is part of the winning line
   */
  const isWinnerCell = (row: number, col: number): boolean => {
    return winnerCells.some((cell) => cell.row === row && cell.col === col);
  };

  /**
   * Handle cell click
   */
  const handleCellClick = (row: number, col: number) => {
    console.log(`🔘 Cell clicked: [${row}][${col}], disabled=${disabled}, isMyTurn=${isMyTurn}, cellValue="${board[row][col]}"`);
    
    if (disabled) {
      console.log('❌ Cell click blocked: disabled');
      return;
    }
    if (!isMyTurn) {
      console.log('❌ Cell click blocked: not my turn');
      return;
    }
    if (board[row][col] !== '') {
      console.log('❌ Cell click blocked: cell already filled');
      return;
    }
    
    console.log('✅ Cell click allowed, calling onCellClick');
    onCellClick(row, col);
  };

  /**
   * Get cell styling
   */
  const getCellStyle = (row: number, col: number): string => {
    const baseStyle = 'w-20 h-20 md:w-24 md:h-24 flex items-center justify-center text-4xl md:text-5xl font-bold border-2 border-gray-300 hover:bg-gray-50 transition-colors cursor-pointer';
    const winnerStyle = isWinnerCell(row, col) ? 'bg-green-200 border-green-500' : '';
    const disabledStyle = disabled || !isMyTurn || board[row][col] !== '' ? 'cursor-not-allowed opacity-50' : 'hover:bg-blue-50';
    
    return `${baseStyle} ${winnerStyle} ${disabledStyle}`;
  };

  /**
   * Get cell content - use regular X and O for better visibility
   */
  const getCellContent = (value: string): string => {
    if (value === 'X') return 'X'; // Changed from ✕ to X for better visibility
    if (value === 'O') return 'O'; // Changed from ○ to O for better visibility
    return '';
  };

  /**
   * Get cell text color - ensure visibility with strong colors
   */
  const getCellTextColor = (value: string): string => {
    if (value === 'X') return 'text-blue-700'; // Changed to darker blue for better visibility
    if (value === 'O') return 'text-red-700';  // Changed to darker red for better visibility
    return 'text-transparent'; // Transparent for empty cells
  };

  return (
    <div className="flex flex-col items-center justify-center p-4">
      {/* Debug info */}
      <div className="mb-4 p-2 bg-yellow-100 rounded text-xs">
        <div>Disabled: {disabled ? 'YES' : 'NO'}</div>
        <div>Is My Turn: {isMyTurn ? 'YES' : 'NO'}</div>
        <div>Is Playing: {isPlaying ? 'YES' : 'NO'}</div>
        <div>Current Player ID: {currentPlayer?.userId}</div>
        <div>My User ID: {currentUserId}</div>
        <div>Move Count: {gameState.moveCount}</div>
        <div>Board Filled: {board.flat().filter(c => c !== '').length} cells</div>
      </div>
      
      <div className="grid grid-cols-3 gap-2 bg-white rounded-lg shadow-lg p-4">
        {board.map((row, rowIndex) =>
          row.map((cell, colIndex) => {
            const cellValue = cell;
            const cellContent = getCellContent(cellValue);
            const cellColor = getCellTextColor(cellValue);
            
            // Debug log for each cell
            if (cellValue !== '') {
              console.log(`✅ Cell [${rowIndex}][${colIndex}] HAS VALUE: value="${cellValue}", content="${cellContent}", color="${cellColor}"`);
            }
            
            const isDisabled = disabled || !isMyTurn || cell !== '';
            
            // Log disabled state for first cell
            if (rowIndex === 0 && colIndex === 0) {
              console.log(`📊 First cell disabled state: disabled=${disabled}, isMyTurn=${isMyTurn}, cell="${cell}", isDisabled=${isDisabled}`);
            }
            
            return (
              <button
                key={`${rowIndex}-${colIndex}`}
                onClick={(e) => {
                  console.log(`🖱️ Button onClick fired: [${rowIndex}][${colIndex}], disabled=${isDisabled}, cell="${cell}"`);
                  e.preventDefault();
                  e.stopPropagation();
                  handleCellClick(rowIndex, colIndex);
                }}
                disabled={isDisabled}
                className={getCellStyle(rowIndex, colIndex)}
                aria-label={`Cell ${rowIndex}, ${colIndex}, ${cell || 'empty'}`}
                style={{
                  minWidth: '80px',
                  minHeight: '80px',
                  cursor: isDisabled ? 'not-allowed' : 'pointer',
                  backgroundColor: isDisabled ? 'transparent' : 'white',
                }}
                onMouseEnter={() => {
                  if (!isDisabled) {
                    console.log(`🖱️ Mouse over cell [${rowIndex}][${colIndex}]`);
                  }
                }}
              >
                <span 
                  className={cellColor}
                  style={{
                    // Force inline styles for maximum visibility
                    color: cellValue === 'X' ? '#1e40af' : cellValue === 'O' ? '#dc2626' : 'transparent',
                    fontSize: '3rem',
                    fontWeight: '900',
                    display: 'block',
                    lineHeight: '1',
                    textShadow: cellValue !== '' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none',
                    WebkitTextStroke: cellValue !== '' ? '1px rgba(0,0,0,0.1)' : 'none',
                  }}
                >
                  {cellContent || (cellValue !== '' ? cellValue : '')}
                </span>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}

