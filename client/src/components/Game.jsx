import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';
import Timer from './Timer.jsx';
import NarrativePhase from './phases/NarrativePhase.jsx';
import VotingPhase from './phases/VotingPhase.jsx';
import PromptingPhase from './phases/PromptingPhase.jsx';
import WritingPhase from './phases/WritingPhase.jsx';
import AlternativeEndingsPhase from './phases/AlternativeEndingsPhase.jsx';
import CompletePhase from './phases/CompletePhase.jsx';
import ThemeSelectionPhase from './phases/ThemeSelectionPhase.jsx';
import RoundSettingPhase from './phases/RoundSettingPhase.jsx';
import RoundCharacterPhase from './phases/RoundCharacterPhase.jsx';
import RoundResultsPhase from './phases/RoundResultsPhase.jsx';
import RoundTwoLeadPhase from './phases/RoundTwoLeadPhase.jsx';
import RoundTwoCollaborationPhase from './phases/RoundTwoCollaborationPhase.jsx';

const PHASE_LABELS = {
  setup: 'Setup',
  theme_selection: 'Theme Selection',
  round1_setting: 'Round 1 – Setting',
  round1_character1: 'Round 1 – Character 1',
  round1_character2: 'Round 1 – Character 2',
  round1_results: 'Round 1 – Story Seeds',
  round2_lead_selection: 'Round 2 – Lead Selection',
  round2_collaboration: 'Round 2 – Collaboration',
  narrative_agreement: 'Narrative Agreement',
  voting: 'Voting',
  prompting: 'Prompting',
  writing: 'Writing',
  alternative_endings: 'Alternative Endings',
  complete: 'Complete'
};

const Game = ({ onScreenChange }) => {
  const { phase, players, timeRemaining, timeExtensions, maxTimeExtensions, isHost, socket, error } = useGame();
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
      theme_selection: <ThemeSelectionPhase />,
      round1_setting: <RoundSettingPhase />,
      round1_character1: <RoundCharacterPhase characterKey="character1" />,
      round1_character2: <RoundCharacterPhase characterKey="character2" />,
      round1_results: <RoundResultsPhase />,
      round2_lead_selection: <RoundTwoLeadPhase />,
      round2_collaboration: <RoundTwoCollaborationPhase />,
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

  const phaseDisplayName = useMemo(
    () => PHASE_LABELS[currentPhase] || currentPhase.replace('_', ' ').toUpperCase(),
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
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          {renderPhase()}
        </div>
      </div>
    </div>
  );
};

export default Game;
