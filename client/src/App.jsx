import React, { useState, useEffect } from 'react';
import { GameProvider, useGame } from './context/GameContext.jsx';
import Landing from './components/Landing.jsx';
import Lobby from './components/Lobby.jsx';
import Game from './components/Game.jsx';
import './App.css';

const AppContent = () => {
  const [currentScreen, setCurrentScreen] = useState('landing');
  const { id, phase } = useGame();

  useEffect(() => {
    if (id && phase === 'setup') {
      setCurrentScreen('lobby');
    } else if (id && phase !== 'setup') {
      setCurrentScreen('game');
    } else {
      setCurrentScreen('landing');
    }
  }, [id, phase]);

  const renderScreen = () => {
    switch (currentScreen) {
      case 'landing':
        return <Landing onScreenChange={setCurrentScreen} />;
      case 'lobby':
        return <Lobby onScreenChange={setCurrentScreen} />;
      case 'game':
        return <Game onScreenChange={setCurrentScreen} />;
      default:
        return <Landing onScreenChange={setCurrentScreen} />;
    }
  };

  return (
    <div className="App">
      {renderScreen()}
    </div>
  );
};

const App = () => (
  <GameProvider>
    <AppContent />
  </GameProvider>
);

export default App;