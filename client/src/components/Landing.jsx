import React, { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';

const Landing = ({ onScreenChange }) => {
  const { socket, error, dispatch } = useGame();
  const [hostName, setHostName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [localError, setLocalError] = useState('');

  const clearErrors = useCallback(() => {
    setLocalError('');
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  const createGame = useCallback(() => {
    if (!hostName.trim()) {
      setLocalError('Please enter your name');
      return;
    }
    clearErrors();
    console.log('Creating game with name:', hostName.trim());
    socket.emit('create-game', hostName.trim());
  }, [hostName, socket, clearErrors]);

  const joinGame = useCallback(() => {
    if (!gameCode.trim() || !playerName.trim()) {
      setLocalError('Please enter both game code and your name');
      return;
    }
    clearErrors();
    console.log('Joining game with code:', gameCode.trim(), 'and name:', playerName.trim());
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);
    socket.emit('join-game', gameCode.trim(), playerName.trim());
  }, [gameCode, playerName, socket, clearErrors]);

  const handleGameCodeChange = useCallback((e) => {
    setGameCode(e.target.value.toUpperCase());
    clearErrors();
  }, [clearErrors]);

  const handlePlayerNameChange = useCallback((e) => {
    setPlayerName(e.target.value);
    clearErrors();
  }, [clearErrors]);

  // const copyToClipboard = (text) => {
  //   navigator.clipboard.writeText(text).then(() => {
  //     setError('Copied to clipboard!');
  //     setTimeout(() => setError(''), 2000);
  //   });
  // };

  return (
    <div className="landing">
      <div className="container">
        <div className="logo-container">
          <img src="/logo.svg" alt="Gnomies Logo" className="app-logo" />
          <h1>Gnomies</h1>
        </div>
        <p className="subtitle">Collaborative Storytelling Adventure</p>
        
        {(error || localError) && (
          <div className={`error-message ${(error || localError).includes('Copied') ? 'success' : ''}`}>
            {error || localError}
          </div>
        )}
        
        <div className="landing-options">
          <div className="option-card">
            <h3>Create Game</h3>
            <p>Start a new storytelling session</p>
            <input
              type="text"
              value={hostName}
              onChange={(e) => setHostName(e.target.value)}
              placeholder="Your name"
              maxLength="20"
            />
            <button onClick={createGame} className="btn btn-primary">
              Create Game
            </button>
          </div>
          
          <div className="option-card">
            <h3>Join Game</h3>
            <p>Enter a game code to join</p>
            <input
              type="text"
              value={gameCode}
              onChange={handleGameCodeChange}
              placeholder="Game Code"
              maxLength="8"
            />
            <input
              type="text"
              value={playerName}
              onChange={handlePlayerNameChange}
              placeholder="Your name"
              maxLength="20"
            />
            <button onClick={joinGame} className="btn btn-secondary">
              Join Game
            </button>
          </div>
        </div>
        
        <div className="game-info">
          <h4>How it works:</h4>
          <ul>
            <li>🎯 Agree on narrative elements together</li>
            <li>✍️ Write story parts anonymously</li>
            <li>🗳️ Vote on the best contributions</li>
            <li>🌳 Create alternative story branches</li>
            <li>⏰ Work with timers and extensions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Landing;
