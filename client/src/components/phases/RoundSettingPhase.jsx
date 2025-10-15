import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';

const RoundSettingPhase = () => {
  const { roundOne, socket, isHost, selectedTheme } = useGame();
  const [settingText, setSettingText] = useState('');

  const submissions = roundOne?.settingSubmissions || [];

  const handleSubmit = () => {
    if (!settingText.trim() || !socket) return;
    socket.emit('submit-round1-setting', settingText.trim());
    setSettingText('');
  };

  const goToNextPhase = () => {
    if (!socket) return;
    socket.emit('start-phase', 'round1_character1');
  };

  return (
    <div className="phase">
      <h3>Round 1: Setting the Scene</h3>
      <p>
        Describe where the story takes place to match the{' '}
        <strong>{selectedTheme || 'chosen'}</strong> theme. Think about sights,
        sounds, and atmosphere.
      </p>

      <div className="input-section">
        <textarea
          value={settingText}
          onChange={(e) => setSettingText(e.target.value)}
          placeholder="Describe the setting for this adventure..."
          maxLength={500}
        />
        <button onClick={handleSubmit} className="btn btn-primary">
          Submit Setting
        </button>
      </div>

      <div className="submissions-list">
        <h4>Shared Ideas</h4>
        {submissions.length === 0 && <p>No settings submitted yet.</p>}
        <div className="submissions-grid">
          {submissions.map((entry, index) => (
            <div key={entry.playerId || index} className="submission-card">
              <div className="submission-author">Contribution {index + 1}</div>
              <div className="submission-content">{entry.content}</div>
            </div>
          ))}
        </div>
      </div>

      {isHost && (
        <div className="phase-actions">
          <button
            onClick={goToNextPhase}
            className="btn btn-primary"
            disabled={submissions.length === 0}
          >
            Next: Character 1
          </button>
        </div>
      )}
    </div>
  );
};

export default RoundSettingPhase;
