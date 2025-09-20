import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';

const AlternativeEndingsPhase = () => {
  const { storyParts, alternativeEndings, socket } = useGame();
  const [ending, setEnding] = useState('');

  const submitEnding = () => {
    if (!ending.trim()) return;
    socket.emit('submit-alternative-ending', ending.trim());
    setEnding('');
  };

  const startEndingVoting = () => {
    socket.emit('start-phase', 'voting');
  };

  return (
    <div className="phase">
      <h3>Create Alternative Endings</h3>
      <p>Write different ways the story could end.</p>
      
      <div className="current-story">
        <h4>Current Story:</h4>
        <div className="story-display">
          {storyParts.map(part => (
            <div key={part.id} className="story-part">
              {part.type === 'drawing' ? (
                <img src={part.content} alt="Drawing" style={{ maxWidth: '100%', height: 'auto' }} />
              ) : (
                part.content
              )}
            </div>
          ))}
        </div>
      </div>
      
      <div className="input-section">
        <textarea
          value={ending}
          onChange={(e) => setEnding(e.target.value)}
          placeholder="Write an alternative ending..."
          maxLength="1000"
        />
        <button onClick={submitEnding} className="btn btn-primary">
          Submit Ending
        </button>
      </div>
      
      <div className="endings-list">
        <h4>Alternative Endings:</h4>
        <div className="endings-container">
          {alternativeEndings.map(ending => (
            <div key={ending.id} className="ending-item">
              <div className="content">{ending.ending}</div>
              <div className="votes">{ending.votes} votes</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="phase-actions">
        <button
          onClick={startEndingVoting}
          className="btn btn-primary"
          disabled={alternativeEndings.length === 0}
        >
          Vote on Endings
        </button>
      </div>
    </div>
  );
};

export default AlternativeEndingsPhase;
