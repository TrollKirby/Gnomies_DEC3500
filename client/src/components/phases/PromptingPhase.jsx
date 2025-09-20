import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';

const PromptingPhase = () => {
  const { narrativeElements, storyParts, socket } = useGame();
  const [prompt, setPrompt] = useState('');

  const submitPrompt = () => {
    if (!prompt.trim()) return;
    socket.emit('submit-story-part', prompt.trim(), 'prompt');
    setPrompt('');
  };

  const startPromptVoting = () => {
    socket.emit('start-phase', 'voting');
  };

  return (
    <div className="phase">
      <h3>Create Story Prompt</h3>
      <p>Based on the selected elements, create an opening prompt for the story.</p>
      
      <div className="selected-elements">
        <h4>Selected Elements:</h4>
        <div className="elements-tags">
          {narrativeElements.map(element => (
            <div key={element.id} className="element-tag">
              {element.element}
            </div>
          ))}
        </div>
      </div>
      
      <div className="input-section">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Write the opening prompt for the story..."
          maxLength="500"
        />
        <button onClick={submitPrompt} className="btn btn-primary">
          Submit Prompt
        </button>
      </div>
      
      <div className="prompts-list">
        <h4>Submitted Prompts:</h4>
        <div className="prompts-container">
          {storyParts.map(prompt => (
            <div key={prompt.id} className="prompt-item">
              <div className="content">{prompt.content}</div>
              <div className="votes">{prompt.votes} votes</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="phase-actions">
        <button
          onClick={startPromptVoting}
          className="btn btn-primary"
          disabled={storyParts.length === 0}
        >
          Vote on Prompts
        </button>
      </div>
    </div>
  );
};

export default PromptingPhase;
