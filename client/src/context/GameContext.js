import React, { createContext, useContext, useReducer, useEffect } from 'react';
import io from 'socket.io-client';

const GameContext = createContext();

// Game state reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return {
        ...state,
        ...action.payload,
        isConnected: true
      };
    case 'SET_PLAYER_INFO':
      return {
        ...state,
        playerId: action.payload.playerId,
        isHost: action.payload.isHost
      };
    case 'SET_CONNECTION':
      return {
        ...state,
        isConnected: action.payload
      };
    case 'CLEAR_GAME':
      return {
        ...state,
        id: null,
        phase: 'setup',
        players: [],
        narrativeElements: [],
        currentPrompt: '',
        storyParts: [],
        alternativeEndings: [],
        timeRemaining: 0,
        timeExtensions: 0,
        isHost: false
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      };
    default:
      return state;
  }
};

const initialState = {
  id: null,
  phase: 'setup',
  players: [],
  narrativeElements: [],
  currentPrompt: '',
  storyParts: [],
  alternativeEndings: [],
  timeRemaining: 0,
  timeExtensions: 0,
  maxTimeExtensions: 2,
  playerId: null,
  isHost: false,
  isConnected: false,
  socket: null,
  error: null
};

export const GameProvider = ({ children }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    const socket = io();
    
    // Socket event listeners
    socket.on('connect', () => {
      dispatch({ type: 'SET_CONNECTION', payload: true });
    });

    socket.on('disconnect', () => {
      dispatch({ type: 'SET_CONNECTION', payload: false });
    });

    socket.on('game-created', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
      dispatch({ type: 'SET_PLAYER_INFO', payload: { playerId: socket.id, isHost: true } });
    });

    socket.on('game-joined', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
      dispatch({ type: 'SET_PLAYER_INFO', payload: { playerId: socket.id, isHost: false } });
    });

    socket.on('join-failed', (message) => {
      console.error('Join failed:', message);
      console.error('Current game state:', state);
      // Dispatch error to be handled by components
      dispatch({ type: 'SET_ERROR', payload: `Join failed: ${message}` });
    });

    socket.on('player-joined', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('player-left', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('phase-started', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('narrative-element-added', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('story-part-added', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('vote-cast', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('time-extended', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    socket.on('alternative-ending-added', (gameState) => {
      dispatch({ type: 'SET_GAME_STATE', payload: gameState });
    });

    dispatch({ type: 'SET_GAME_STATE', payload: { socket } });

    return () => {
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = {
    ...state,
    dispatch
  };

  return (
    <GameContext.Provider value={value}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
};
