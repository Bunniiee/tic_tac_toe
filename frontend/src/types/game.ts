/**
 * Type definitions for the Tic-Tac-Toe game client
 * These types should match the server-side types for consistency
 */

/**
 * Player symbol: X or O
 */
export type PlayerSymbol = 'X' | 'O';

/**
 * Cell value: empty, X, or O
 */
export type CellValue = '' | PlayerSymbol;

/**
 * Game state status
 */
export enum MatchState {
  WAITING = 'WAITING',
  PLAYING = 'PLAYING',
  FINISHED = 'FINISHED',
  ABANDONED = 'ABANDONED'
}

/**
 * Game result
 */
export enum GameResult {
  X_WINS = 'X_WINS',
  O_WINS = 'O_WINS',
  DRAW = 'DRAW',
  ONGOING = 'ONGOING'
}

/**
 * Player information
 */
export interface Player {
  userId: string;
  username: string;
  symbol: PlayerSymbol;
  present: boolean;
}

/**
 * Board state: 3x3 grid
 */
export type BoardState = [
  [CellValue, CellValue, CellValue],
  [CellValue, CellValue, CellValue],
  [CellValue, CellValue, CellValue]
];

/**
 * Game state structure
 */
export interface GameState {
  board: BoardState;
  currentPlayer: PlayerSymbol;
  players: {
    X?: Player;
    O?: Player;
  };
  state: MatchState;
  result: GameResult;
  moveCount: number;
  lastMoveTime: number;
  winnerCells?: Array<{ row: number; col: number }>;
  timeoutWarningSent?: boolean;
}

/**
 * Server message types
 */
export enum ServerMessageType {
  GAME_STATE = 'GAME_STATE',
  MOVE_ACCEPTED = 'MOVE_ACCEPTED',
  MOVE_REJECTED = 'MOVE_REJECTED',
  GAME_OVER = 'GAME_OVER',
  PLAYER_JOINED = 'PLAYER_JOINED',
  PLAYER_LEFT = 'PLAYER_LEFT',
  ERROR = 'ERROR',
  TIMEOUT_WARNING = 'TIMEOUT_WARNING'
}

/**
 * Client message types
 */
export enum ClientMessageType {
  MAKE_MOVE = 'MAKE_MOVE',
  PING = 'PING'
}

/**
 * Server message structure
 */
export interface ServerMessage {
  type: ServerMessageType;
  data?: GameState | string | { row: number; col: number; message: string };
}

/**
 * Client message structure
 */
export interface ClientMessage {
  type: ClientMessageType;
  data?: {
    row?: number;
    col?: number;
  };
}

/**
 * Player statistics
 */
export interface PlayerStats {
  userId: string;
  username: string;
  wins: number;
  losses: number;
  draws: number;
  winStreak: number;
  totalGames: number;
  winRate: number;
}

/**
 * Connection state
 */
export enum ConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  ERROR = 'ERROR'
}

/**
 * Matchmaking state
 */
export enum MatchmakingState {
  IDLE = 'IDLE',
  SEARCHING = 'SEARCHING',
  MATCHED = 'MATCHED',
  ERROR = 'ERROR'
}

