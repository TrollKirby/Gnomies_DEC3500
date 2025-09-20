import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';
import Timer from './Timer.jsx';
import NarrativePhase from './phases/NarrativePhase.jsx';
import VotingPhase from './phases/VotingPhase.jsx';
import PromptingPhase from './phases/PromptingPhase.jsx';
import WritingPhase from './phases/WritingPhase.jsx';
import AlternativeEndingsPhase from './phases/AlternativeEndingsPhase.jsx';
import CompletePhase from './phases/CompletePhase.jsx';

const Game = ({ onScreenChange }) => {
  const { phase, players, timeRemaining, timeExtensions, maxTimeExtensions, isHost, socket } = useGame();
  const [currentPhase, setCurrentPhase] = useState(phase);

  useEffect(() => {
    setCurrentPhase(phase);
  }, [phase]);

  const requestTimeExtension = useCallback(() => {
    socket.emit('request-time-extension');
  }, [socket]);

  const leaveGame = useCallback(() => {
    socket.disconnect();
    onScreenChange('landing');
  }, [socket, onScreenChange]);

  const renderPhase = useCallback(() => {
    const phaseComponents = {
      narrative_agreement: <NarrativePhase />,
      voting: <VotingPhase />,
      prompting: <PromptingPhase />,
      writing: <WritingPhase />,
      alternative_endings: <AlternativeEndingsPhase />,
      complete: <CompletePhase onNewGame={() => onScreenChange('landing')} />
    };
    
    return phaseComponents[currentPhase] || <div>Loading...</div>;
  }, [currentPhase, onScreenChange]);

  const canExtendTime = useMemo(() => 
    isHost && timeExtensions < maxTimeExtensions, 
    [isHost, timeExtensions, maxTimeExtensions]
  );

  const phaseDisplayName = useMemo(() => 
    currentPhase.replace('_', ' ').toUpperCase(), 
    [currentPhase]
  );

  return (
    <div className="game">
      <div className="game-container">
        <div className="game-header">
          <div className="game-title">
            <img src="/logo.svg" alt="Gnomies Logo" className="header-logo" />
            <span className="game-name">Gnomies</span>
          </div>
          <div className="phase-indicator">
            <span>{phaseDisplayName}</span>
          </div>
          <Timer
            timeRemaining={timeRemaining}
            onTimeExtension={requestTimeExtension}
            canExtend={canExtendTime}
          />
          <div className="game-info">
            <span>{players.length} players</span>
          </div>
          <button onClick={leaveGame} className="btn btn-danger btn-small">
            Leave
          </button>
        </div>

        <div className="phase-content">
          {renderPhase()}
        </div>
      </div>
    </div>
  );
};

export default Game;
