import React, { useState, useCallback } from 'react';
import { useGame } from '../context/GameContext.jsx';

const generateAnonymousName = () => {
  const adjectives = ['Mysterious', 'Silent', 'Curious', 'Brave', 'Wandering', 'Clever'];
  const nouns = ['Gnome', 'Sprite', 'Scribe', 'Storyteller', 'Quill', 'Owl'];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = Math.floor(100 + Math.random() * 900);
  return `${adjective} ${noun} ${number}`;
};

const Landing = ({ onScreenChange }) => {
  const { socket, error, dispatch } = useGame();
  const [anonymousName] = useState(() => generateAnonymousName());
  const [gameCode, setGameCode] = useState('');
  const [localError, setLocalError] = useState('');

  const clearErrors = useCallback(() => {
    setLocalError('');
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  const createGame = useCallback(() => {
    if (!socket || !socket.connected) {
      setLocalError('Connecting to server. Please try again in a moment.');
      if (socket && !socket.connected) {
        socket.connect();
      }
      return;
    }
    clearErrors();
    console.log('Creating game with anonymous name:', anonymousName);
    socket.emit('create-game', anonymousName);
  }, [anonymousName, socket, clearErrors]);

  const joinGame = useCallback(() => {
    if (!gameCode.trim()) {
      setLocalError('Please enter a game code');
      return;
    }
    clearErrors();
    console.log('Joining game with code:', gameCode.trim(), 'and anonymous name:', anonymousName);
    console.log('Socket connected:', socket.connected);
    console.log('Socket ID:', socket.id);
    socket.emit('join-game', gameCode.trim(), anonymousName);
  }, [gameCode, anonymousName, socket, clearErrors]);

  const handleGameCodeChange = useCallback((e) => {
    setGameCode(e.target.value.toUpperCase());
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
        <p className="subtitle">
          You will appear as <strong>{anonymousName}</strong>
        </p>
        
        {(error || localError) && (
          <div className={`error-message ${(error || localError).includes('Copied') ? 'success' : ''}`}>
            {error || localError}
          </div>
        )}
        
        <div className="landing-options">
          <div className="option-card">
            <h3>Create Game</h3>
            <p>Start a new storytelling session</p>
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
