/**
 * Custom hook for matchmaking
 */

import { useState, useEffect, useCallback } from 'react';
import { useNakama } from '../contexts/NakamaContext';
import { MatchmakingState } from '../types';

interface UseMatchmakingReturn {
  matchmakingState: MatchmakingState;
  matchId: string | null;
  ticket: string | null;
  error: string | null;
  findMatch: () => Promise<void>;
  cancelMatchmaking: () => Promise<void>;
  reset: () => void;
}

/**
 * Hook to handle matchmaking
 */
export function useMatchmaking(): UseMatchmakingReturn {
  const { client, socket, session, isConnected } = useNakama();
  const [matchmakingState, setMatchmakingState] = useState<MatchmakingState>(MatchmakingState.IDLE);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle matchmaker matched event
   */
  useEffect(() => {
    if (!socket || !isConnected) {
      return;
    }

    const handleMatchmakerMatched = async (matched: { match_id: string; token: string }) => {
      console.log('Matchmaker matched:', matched);
      try {
        // Join the match
        const match = await socket.joinMatch(matched.match_id);
        setMatchId(match.match_id);
        setMatchmakingState(MatchmakingState.MATCHED);
        setTicket(null);
      } catch (err) {
        console.error('Error joining match:', err);
        setError('Failed to join match');
        setMatchmakingState(MatchmakingState.ERROR);
      }
    };

    socket.onmatchmakermatched = handleMatchmakerMatched;

    return () => {
      socket.onmatchmakermatched = undefined;
    };
  }, [socket, isConnected]);

  /**
   * Find a match
   */
  const findMatch = useCallback(async () => {
    if (!socket || !isConnected) {
      setError('Not connected to server');
      return;
    }

    // Don't check socket.isConnected - if isConnected from context is true, proceed
    // The socket.isConnected property sometimes doesn't update even though the WebSocket is connected
    // We rely on the context's isConnected state instead
    
    setMatchmakingState(MatchmakingState.SEARCHING);
    setError(null);
    setMatchId(null);

    try {
      // Verify socket is ready - wait a bit if needed
      let ready = false;
      let waitAttempts = 0;
      while (!ready && waitAttempts < 10) {
        // Check if socket appears ready (even if isConnected is false, socket might work)
        if (socket) {
          ready = true;
          break;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
        waitAttempts++;
      }
      
      console.log('Attempting to add to matchmaker...');
      // Add to matchmaker (Nakama will automatically match players when 2 are found)
      // Signature: addMatchmaker(query: string, minCount: number, maxCount: number, stringProperties?, numericProperties?)
      // - query: Match query string (empty string for basic matching)
      // - minCount: Minimum players required (2)
      // - maxCount: Maximum players allowed (2)
      // - stringProperties: Optional string properties (empty object)
      // - numericProperties: Optional numeric properties (empty object)
      const matchmakerTicket = await socket.addMatchmaker('', 2, 2, {}, {});
      setTicket(matchmakerTicket.ticket);
      console.log('Matchmaking started successfully, ticket:', matchmakerTicket.ticket);
    } catch (err) {
      console.error('Error finding match:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to start matchmaking';
      setError(errorMessage);
      setMatchmakingState(MatchmakingState.ERROR);
    }
  }, [socket, isConnected]);

  /**
   * Cancel matchmaking
   */
  const cancelMatchmaking = useCallback(async () => {
    if (!socket || !ticket) {
      return;
    }

    try {
      await socket.removeMatchmaker(ticket);
      setTicket(null);
      setMatchmakingState(MatchmakingState.IDLE);
    } catch (err) {
      console.error('Error canceling matchmaking:', err);
      setError('Failed to cancel matchmaking');
    }
  }, [socket, ticket]);

  /**
   * Reset matchmaking state
   */
  const reset = useCallback(() => {
    setMatchmakingState(MatchmakingState.IDLE);
    setMatchId(null);
    setTicket(null);
    setError(null);
  }, []);

  return {
    matchmakingState,
    matchId,
    ticket,
    error,
    findMatch,
    cancelMatchmaking,
    reset,
  };
}

