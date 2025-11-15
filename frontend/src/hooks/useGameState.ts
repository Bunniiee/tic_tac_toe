/**
 * Custom hook for managing game state from Nakama socket messages
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNakama } from '../contexts/NakamaContext';
import { GameState, ServerMessage, ServerMessageType, MatchState, ClientMessage, ClientMessageType } from '../types';

interface UseGameStateReturn {
  gameState: GameState | null;
  isLoading: boolean;
  error: string | null;
  makeMove: (row: number, col: number) => Promise<void>;
  reset: () => void;
}

/**
 * Hook to manage game state from Nakama socket
 */
export function useGameState(matchId: string | null): UseGameStateReturn {
  const { socket, isConnected, client, session } = useNakama();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to avoid stale closures
  const gameStateRef = useRef<GameState | null>(null);
  const setGameStateRef = useRef(setGameState);
  
  // Update refs when state/setter changes
  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);
  
  useEffect(() => {
    setGameStateRef.current = setGameState;
  }, []);
  
  // Log whenever gameState changes
  useEffect(() => {
    console.log('✅ gameState CHANGED! New state:', gameState);
    console.log('✅ gameState board:', gameState?.board);
    console.log('✅ gameState moveCount:', gameState?.moveCount);
    if (gameState?.board) {
      const filledCells = gameState.board.flat().filter(cell => cell !== '').length;
      console.log('✅ Filled cells count:', filledCells);
    }
  }, [gameState]);

  /**
   * Handle incoming socket messages
   */
  useEffect(() => {
    if (!socket || !isConnected || !matchId) {
      console.log('useGameState useEffect: missing socket, isConnected, or matchId', { socket: !!socket, isConnected, matchId });
      return;
    }

    console.log('Setting up onmatchdata handler for matchId:', matchId);

    const handleMessage = (message: { data: string | Uint8Array; opcode?: number } | any) => {
      try {
        console.log('Received match data message:', message);
        
        // Handle both string and Uint8Array data
        // Nakama sends MatchData object with data property
        let messageData: string;
        
        // Check if message has a data property (Nakama MatchData format)
        if (message && typeof message === 'object' && 'data' in message) {
          if (typeof message.data === 'string') {
            messageData = message.data;
          } else if (message.data instanceof Uint8Array) {
            // Convert Uint8Array to string
            messageData = new TextDecoder().decode(message.data);
          } else if (message.data instanceof ArrayBuffer) {
            messageData = new TextDecoder().decode(new Uint8Array(message.data));
          } else {
            console.error('Unknown message.data type:', typeof message.data, message);
            return;
          }
        } else if (typeof message === 'string') {
          messageData = message;
        } else {
          console.error('Unknown message format:', typeof message, message);
          return;
        }

        console.log('Parsing server message:', messageData);
        const serverMessage: ServerMessage = JSON.parse(messageData);
        console.log('Parsed server message:', serverMessage);

        switch (serverMessage.type) {
          case ServerMessageType.GAME_STATE:
          case ServerMessageType.MOVE_ACCEPTED:
          case ServerMessageType.PLAYER_JOINED:
          case ServerMessageType.GAME_OVER:
            console.log('Processing server message type:', serverMessage.type);
            console.log('Server message data:', serverMessage.data);
            console.log('Has board?', serverMessage.data && typeof serverMessage.data === 'object' && 'board' in serverMessage.data);
            
            if (serverMessage.data && typeof serverMessage.data === 'object' && 'board' in serverMessage.data) {
              console.log('Updating game state with:', serverMessage.data);
              
              // Create a new object to ensure React detects the change
              const sourceState = serverMessage.data as GameState;
              const newGameState: GameState = {
                ...sourceState,
                board: sourceState.board.map(row => [...row] as [string, string, string]) as GameState['board'], // Deep copy board array with proper typing
                players: {
                  ...sourceState.players,
                  X: sourceState.players.X ? { ...sourceState.players.X } : undefined,
                  O: sourceState.players.O ? { ...sourceState.players.O } : undefined,
                }
              };
              
              console.log('New game state (deep copied):', newGameState);
              console.log('New game state board:', newGameState.board);
              
              // Update state - creating new object ensures React detects the change
              // Use the ref to ensure we're using the latest setter
              console.log('Calling setGameState with new state:', newGameState);
              setGameStateRef.current(newGameState);
              setError(null);
              
              console.log('State update triggered');
            } else {
              console.warn('Game state message missing board or invalid format:', serverMessage);
            }
            break;

          case ServerMessageType.MOVE_REJECTED:
            if (typeof serverMessage.data === 'string') {
              setError(serverMessage.data);
            }
            break;

          case ServerMessageType.ERROR:
            if (typeof serverMessage.data === 'string') {
              setError(serverMessage.data);
            }
            break;

          case ServerMessageType.TIMEOUT_WARNING:
            // Handle timeout warning (could show a toast notification)
            console.warn('Timeout warning:', serverMessage.data);
            break;

          default:
            console.log('Unknown message type:', serverMessage.type);
        }
      } catch (err) {
        console.error('Error parsing socket message:', err);
        setError('Failed to parse server message');
      }
    };

    // Listen for match data messages
    console.log('Registering onmatchdata handler');
    socket.onmatchdata = handleMessage;
    console.log('onmatchdata handler registered');

    // Cleanup
    return () => {
      console.log('Cleaning up onmatchdata handler');
      if (socket && socket.onmatchdata) {
        socket.onmatchdata = () => {}; // Set to empty function instead of undefined
      }
    };
  }, [socket, isConnected, matchId]);

  /**
   * Make a move
   */
  const makeMove = useCallback(
    async (row: number, col: number) => {
      if (!socket || !isConnected || !matchId) {
        setError('Not connected to server');
        return;
      }

      if (!gameState || gameState.state !== MatchState.PLAYING) {
        setError('Game is not in progress');
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const message: ClientMessage = {
          type: ClientMessageType.MAKE_MOVE,
          data: { row, col },
        };

        console.log('📤 Sending move via sendMatchState:', { row, col, matchId, message });
        console.log('📤 Socket state:', { 
          socketExists: !!socket, 
          socketReady: socket ? 'yes' : 'no',
          matchId,
          isConnected 
        });
        
        // Send move via RPC instead of sendMatchState
        // sendMatchState has base64 encoding issues in Nakama's JavaScript runtime
        // RPC receives data as string directly, avoiding encoding/decoding issues
        if (!client || !session) {
          throw new Error('Client or session not available');
        }
        
        // Call RPC with match ID, row, and col
        // Nakama client.rpc expects (session, id, payload) where payload is string
        const rpcPayload = JSON.stringify({ matchId, row, col });
        console.log('📤 Calling make_move RPC:', { matchId, row, col });
        
        const rpcResult = await client.rpc(session, 'make_move', rpcPayload as any);
        console.log('✅ RPC call completed');
        
        // Parse RPC response
        if (rpcResult.payload) {
          const response = typeof rpcResult.payload === 'string' 
            ? JSON.parse(rpcResult.payload) 
            : rpcResult.payload;
          
          if (response.success && response.gameState) {
            // Update local state immediately from RPC response
            // This provides instant feedback while server broadcasts to other players
            console.log('✅ Move processed successfully, updating local state');
            const updatedGameState = response.gameState;
            
            // Deep copy the board to ensure React detects changes
            const newBoard: GameState['board'] = updatedGameState.board.map((row: string[]) => [...row]);
            const newPlayers = { ...updatedGameState.players };
            const newGameState: GameState = {
              ...updatedGameState,
              board: newBoard,
              players: newPlayers
            };
            
            setGameState(newGameState);
            console.log('✅ Local state updated from RPC response');
          } else if (!response.success) {
            throw new Error(response.error || 'Move failed');
          }
        }
        
        // Don't update state here - wait for server response via onmatchdata
        // The server will broadcast the updated state to all players
        
        console.log('✅ Move send completed');
      } catch (err) {
        console.error('Error making move:', err);
        setError('Failed to make move');
      } finally {
        setIsLoading(false);
      }
    },
    [socket, isConnected, matchId, gameState]
  );

  /**
   * Reset game state
   */
  const reset = useCallback(() => {
    setGameState(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    gameState,
    isLoading,
    error,
    makeMove,
    reset,
  };
}

