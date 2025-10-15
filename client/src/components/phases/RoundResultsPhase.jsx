import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import RoundOneSummary from '../RoundOneSummary.jsx';

const RoundResultsPhase = () => {
  const { roundOne, socket, isHost, selectedTheme } = useGame();

  const hasAnySubmission = useMemo(() => {
    const settingSubmissions = roundOne?.settingSubmissions || [];
    const characterOneSubmissions =
      roundOne?.characterSubmissions?.character1 || [];
    const characterTwoSubmissions =
      roundOne?.characterSubmissions?.character2 || [];
    return (
      settingSubmissions.length > 0 ||
      characterOneSubmissions.length > 0 ||
      characterTwoSubmissions.length > 0
    );
  }, [roundOne]);

  const startRoundTwo = () => {
    if (!socket) return;
    socket.emit('start-phase', 'round2_lead_selection');
  };

  return (
    <div className="phase">
      <h3>Round 1: Story Seeds</h3>
      <p>
        Theme: <strong>{selectedTheme || 'TBD'}</strong>
      </p>
      <p>
        Here are everyone&apos;s anonymous submissions. Review the ideas and
        move on when you&apos;re ready to start the collaboration sprint.
      </p>
      <RoundOneSummary />

      {isHost && (
        <div className="phase-actions">
          <button
            onClick={startRoundTwo}
            className="btn btn-primary"
            disabled={!hasAnySubmission}
          >
            Start Round 2
          </button>
        </div>
      )}
    </div>
  );
};

export default RoundResultsPhase;
