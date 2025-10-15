import React, { useEffect, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

const Lobby = ({ onScreenChange }) => {
  const { id, players, isHost, socket } = useGame();

  useEffect(() => {
    if (id) {
      onScreenChange('lobby');
    }
  }, [id, onScreenChange]);

  const startGame = useCallback(() => {
    socket.emit('start-phase', 'theme_selection');
    onScreenChange('game');
  }, [socket, onScreenChange]);

  const leaveGame = useCallback(() => {
    socket.disconnect();
    onScreenChange('landing');
  }, [socket, onScreenChange]);

  const copyGameCode = useCallback(() => {
    const gameCode = id ? id.substring(0, 8).toUpperCase() : '';
    navigator.clipboard.writeText(gameCode);
  }, [id]);

  const gameCode = useMemo(() => 
    id ? id.substring(0, 8).toUpperCase() : '', 
    [id]
  );

  const canStartGame = useMemo(() => 
    isHost && players.length >= 2, 
    [isHost, players.length]
  );

  return (
    <div className="lobby">
      <div className="container">
        <div className="game-header">
          <div className="lobby-title">
            <img src="/logo.svg" alt="Gnomies Logo" className="header-logo" />
            <h2>Game Lobby</h2>
          </div>
          <div className="game-code">
            <span>Game Code: </span>
            <code>{gameCode}</code>
            <button onClick={copyGameCode} className="btn btn-small">
              Copy
            </button>
          </div>
        </div>
        
        <div className="players-list">
          <h3>Players ({players.length}/8)</h3>
          <div className="players-container">
            {players.map(player => (
              <div key={player.id} className={`player-card ${player.isHost ? 'host' : ''}`}>
                <div className="name">{player.name}</div>
                <div className="status">{player.isHost ? 'Host' : 'Player'}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="lobby-actions">
          <button
            onClick={startGame}
            className="btn btn-primary"
            disabled={!canStartGame}
          >
            Start Game
          </button>
          <button onClick={leaveGame} className="btn btn-danger">
            Leave Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
