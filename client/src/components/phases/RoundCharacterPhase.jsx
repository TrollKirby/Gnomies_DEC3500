import React, { useMemo, useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';

const CHARACTER_TITLES = {
  character1: 'Character 1',
  character2: 'Character 2'
};

const CHARACTER_DESCRIPTIONS = {
  character1: 'Give this character a backstory, personality, and motivation based on the image.',
  character2: 'Describe this companion or rival. What drives them? How do they fit the theme?'
};

const RoundCharacterPhase = ({ characterKey }) => {
  const { roundOne, socket, isHost, selectedTheme } = useGame();
  const [description, setDescription] = useState('');
  const [imageError, setImageError] = useState(false);

  const submissions =
    roundOne?.characterSubmissions?.[characterKey] || [];

  const nextPhase = useMemo(() => {
    if (characterKey === 'character1') return 'round1_character2';
    if (characterKey === 'character2') return 'round1_results';
    return null;
  }, [characterKey]);

  const heading = CHARACTER_TITLES[characterKey] || 'Character';
  const helperText =
    CHARACTER_DESCRIPTIONS[characterKey] ||
    'Share what stands out to you about this character.';

  const imageSrc = `/character-images/${characterKey}.png`;

  const handleSubmit = () => {
    if (!description.trim() || !socket) return;
    socket.emit('submit-round1-character', characterKey, description.trim());
    setDescription('');
  };

  const handleNext = () => {
    if (!socket || !nextPhase) return;
    socket.emit('start-phase', nextPhase);
  };

  return (
    <div className="phase">
      <h3>
        Round 1: {heading}
      </h3>
      <p>
        Theme: <strong>{selectedTheme || 'TBD'}</strong>
      </p>
      <p>{helperText}</p>

      <div className="character-phase-content">
        {!imageError ? (
          <img
            src={imageSrc}
            alt={`${heading} prompt`}
            className="character-reference"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="character-reference placeholder">
            Image coming soon. Imagine the character and describe them!
          </div>
        )}

        <div className="input-section">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`Describe ${heading.toLowerCase()} here...`}
            maxLength={500}
          />
          <button onClick={handleSubmit} className="btn btn-primary">
            Submit Description
          </button>
        </div>
      </div>

      <div className="submissions-list">
        <h4>Character Notes</h4>
        {submissions.length === 0 && <p>No descriptions yet.</p>}
        <div className="submissions-grid">
          {submissions.map((entry, index) => (
            <div key={entry.playerId || index} className="submission-card">
              <div className="submission-author">
                Contribution {index + 1}
              </div>
              <div className="submission-content">{entry.content}</div>
            </div>
          ))}
        </div>
      </div>

      {isHost && nextPhase && (
        <div className="phase-actions">
          <button
            onClick={handleNext}
            className="btn btn-primary"
            disabled={submissions.length === 0}
          >
            {characterKey === 'character1'
              ? 'Next: Character 2'
              : 'Review Submissions'}
          </button>
        </div>
      )}
    </div>
  );
};

export default RoundCharacterPhase;
