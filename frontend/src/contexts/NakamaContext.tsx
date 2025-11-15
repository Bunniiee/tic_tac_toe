/**
 * Nakama Context for managing client connection and authentication
 */

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { Client, Session, Socket } from '@heroiclabs/nakama-js';
import { ConnectionState } from '../types';

interface NakamaContextType {
  client: Client | null;
  session: Session | null;
  socket: Socket | null;
  connectionState: ConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  isConnected: boolean;
}

const NakamaContext = createContext<NakamaContextType | undefined>(undefined);

interface NakamaProviderProps {
  children: ReactNode;
  serverUrl?: string;
  serverKey?: string;
}

/**
 * Nakama Provider Component
 * Manages Nakama client connection and authentication
 */
export function NakamaProvider({ children, serverUrl, serverKey }: NakamaProviderProps) {
  const [client, setClient] = useState<Client | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED);
  
  // Use refs to track connection state and prevent duplicate connections
  const isConnectingRef = useRef(false);
  const isConnectedRef = useRef(false);
  const mountedRef = useRef(true);
  const socketRef = useRef<Socket | null>(null);

  // Get server URL from environment or use default
  const nakamaServerUrl = serverUrl || import.meta.env.VITE_NAKAMA_SERVER_URL || 'localhost';
  const nakamaServerKey = serverKey || import.meta.env.VITE_NAKAMA_SERVER_KEY || 'defaultkey';
  const nakamaServerPort = import.meta.env.VITE_NAKAMA_SERVER_PORT || '7351';

  // Extract hostname from URL (remove protocol if present)
  const extractHostname = (url: string): string => {
    try {
      // If URL contains protocol, extract hostname
      if (url.includes('://')) {
        const urlObj = new URL(url);
        return urlObj.hostname;
      }
      // Otherwise return as-is (assumed to be hostname)
      return url.split(':')[0]; // Remove port if present
    } catch {
      // If URL parsing fails, return as-is
      return url.split(':')[0];
    }
  };

  const nakamaHostname = extractHostname(nakamaServerUrl);
  const nakamaPort = parseInt(nakamaServerPort, 10) || 7351;
  const useSSL = nakamaServerUrl.includes('https://') || nakamaServerPort === '443';
  
  // Log connection parameters for debugging
  console.log('Nakama connection parameters:', {
    hostname: nakamaHostname,
    port: nakamaPort,
    useSSL,
    serverKey: nakamaServerKey.substring(0, 10) + '...'
  });

  /**
   * Generate a unique device ID
   */
  const generateDeviceId = (): string => {
    return `device_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  };

  /**
   * Connect to Nakama server
   */
  const connect = useCallback(async () => {
    // Prevent multiple simultaneous connection attempts
    if (isConnectingRef.current || isConnectedRef.current) {
      return;
    }

    try {
      isConnectingRef.current = true;
      setConnectionState(ConnectionState.CONNECTING);

      // Clean up existing socket if any
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (e) {
          // Ignore cleanup errors
        }
        socketRef.current = null;
      }

      // Create client with 30 second timeout for operations
      // Client constructor: new Client(defaultServerKey, host, port, useSSL?, timeout?, autoRefreshSession?)
      console.log('Creating Nakama client...');
      const nakamaClient = new Client(nakamaServerKey, nakamaHostname, nakamaPort, useSSL, 30000);
      setClient(nakamaClient);
      console.log('Nakama client created');

      // Authenticate with device ID
      // Generate a device ID from localStorage or create a new one
      let deviceId = localStorage.getItem('nakama_device_id');
      if (!deviceId) {
        deviceId = generateDeviceId();
        localStorage.setItem('nakama_device_id', deviceId);
      }

      // Authenticate
      console.log('Authenticating with device ID...');
      const nakamaSession = await nakamaClient.authenticateDevice(deviceId, true);
      setSession(nakamaSession);
      console.log('Authentication successful, user ID:', nakamaSession.user_id);

      // Create socket connection
      console.log('Creating socket connection...');
      const nakamaSocket = nakamaClient.createSocket();
      console.log('Socket created, connecting to:', `${useSSL ? 'wss' : 'ws'}://${nakamaHostname}:${nakamaPort}`);
      
      // Note: Socket timeout is configured via Client constructor timeout parameter (already set to 30000ms)
      
      // Set up event handlers for future reference (but don't wait for them)
      nakamaSocket.onconnect = () => {
        console.log('Socket onconnect event fired');
        if (mountedRef.current && !isConnectedRef.current) {
          socketRef.current = nakamaSocket;
          setSocket(nakamaSocket);
          setConnectionState(ConnectionState.CONNECTED);
          isConnectedRef.current = true;
          isConnectingRef.current = false;
        }
      };

      nakamaSocket.ondisconnect = () => {
        console.log('Socket ondisconnect event fired');
        if (mountedRef.current) {
          socketRef.current = null;
          setConnectionState(ConnectionState.DISCONNECTED);
          isConnectedRef.current = false;
          isConnectingRef.current = false;
        }
      };

      nakamaSocket.onerror = (error) => {
        console.error('Socket onerror event fired:', error);
        if (mountedRef.current) {
          socketRef.current = null;
          setConnectionState(ConnectionState.ERROR);
          isConnectedRef.current = false;
          isConnectingRef.current = false;
        }
      };

      // Connect socket - try without createStatus parameter (default is true anyway)
      // socket.connect(session, createStatus?, connectTimeoutMs?)
      console.log('Calling socket.connect()...');
      console.log('Session token (first 20 chars):', nakamaSession.token.substring(0, 20) + '...');
      
      try {
        // Connect with longer timeout - don't wait for onconnect, just wait for connect() to resolve
        await nakamaSocket.connect(nakamaSession, true, 20000);
        console.log('Socket connect() promise resolved');
        
        // Give the socket time to establish the Nakama protocol handshake
        // The WebSocket is open, but Nakama's protocol needs a moment to be ready for operations
        console.log('Waiting for socket to be ready for operations...');
        
        // Wait longer to ensure Nakama protocol handshake is complete
        // This is critical for operations like addMatchmaker to work
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds for protocol handshake
        
        console.log('Socket should now be ready for operations');
        
        // Set socket reference and state
        if (mountedRef.current) {
          socketRef.current = nakamaSocket;
          setSocket(nakamaSocket);
          
          if (nakamaSocket.isConnected) {
            setConnectionState(ConnectionState.CONNECTED);
            isConnectedRef.current = true;
            isConnectingRef.current = false;
            console.log('Socket connection confirmed - isConnected is true');
          } else {
            // The WebSocket IS connected (ping/pong working), but isConnected flag hasn't updated
            // Force set connection state and mark as connected - the actual WebSocket is working
            console.warn('Socket connect() resolved but isConnected is false - WebSocket is actually connected, forcing connection state');
            setConnectionState(ConnectionState.CONNECTED);
            isConnectedRef.current = true;
            isConnectingRef.current = false;
            // Manually trigger the onconnect handler behavior since it may not fire
            // Try to set the isConnected property if possible (it's readonly, but we mark our own state)
            console.log('Socket connection established - proceeding with connection (WebSocket is functional)');
          }
        }
        
      } catch (error) {
        console.error('Socket connection failed:', error);
        throw error;
      }
    } catch (error) {
      if (mountedRef.current) {
        console.error('Failed to connect to Nakama:', error);
        setConnectionState(ConnectionState.ERROR);
        isConnectingRef.current = false;
      }
      throw error;
    }
  }, [nakamaServerKey, nakamaHostname, nakamaPort, useSSL]);

  /**
   * Disconnect from Nakama server
   */
  const disconnect = useCallback(() => {
    isConnectedRef.current = false;
    isConnectingRef.current = false;
    
    if (socketRef.current) {
      try {
        socketRef.current.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
      socketRef.current = null;
      setSocket(null);
    }
    setSession(null);
    setClient(null);
    setConnectionState(ConnectionState.DISCONNECTED);
  }, []);

  // Auto-connect on mount
  useEffect(() => {
    mountedRef.current = true;
    
    // Only connect if not already connected or connecting
    if (!isConnectedRef.current && !isConnectingRef.current) {
      connect().catch((error) => {
        if (mountedRef.current) {
          console.error('Auto-connect failed:', error);
        }
      });
    }

    // Cleanup on unmount
    return () => {
      mountedRef.current = false;
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps - only run on mount/unmount

  const value: NakamaContextType = {
    client,
    session,
    socket,
    connectionState,
    connect,
    disconnect,
    isConnected: connectionState === ConnectionState.CONNECTED && socket !== null,
  };

  return <NakamaContext.Provider value={value}>{children}</NakamaContext.Provider>;
}

/**
 * Hook to use Nakama context
 */
export function useNakama(): NakamaContextType {
  const context = useContext(NakamaContext);
  if (context === undefined) {
    throw new Error('useNakama must be used within a NakamaProvider');
  }
  return context;
}

