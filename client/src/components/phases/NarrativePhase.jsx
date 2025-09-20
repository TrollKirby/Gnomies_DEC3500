import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';

const NarrativePhase = () => {
  const { narrativeElements, socket } = useGame();
  const [element, setElement] = useState('');

  const submitElement = () => {
    if (!element.trim()) return;
    socket.emit('submit-narrative-element', element.trim());
    setElement('');
  };

  const startVoting = () => {
    socket.emit('start-phase', 'voting');
  };

  return (
    <div className="phase">
      <h3>Agree on Narrative Elements</h3>
      <p>Each player suggests 2-3 key elements for the story (characters, setting, conflict, etc.)</p>
      
      <div className="input-section">
        <textarea
          value={element}
          onChange={(e) => setElement(e.target.value)}
          placeholder="Enter a narrative element (e.g., 'A mysterious forest', 'A talking cat', 'A time-traveling detective')"
          maxLength="100"
        />
        <button onClick={submitElement} className="btn btn-primary">
          Submit Element
        </button>
      </div>
      
      <div className="elements-list">
        <h4>Submitted Elements:</h4>
        <div className="elements-container">
          {narrativeElements.map(item => (
            <div key={item.id} className="element-item">
              <div className="content">{item.element}</div>
              <div className="votes">{item.votes} votes</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="phase-actions">
        <button
          onClick={startVoting}
          className="btn btn-primary"
          disabled={narrativeElements.length < 3}
        >
          Start Voting
        </button>
      </div>
    </div>
  );
};

export default NarrativePhase;
