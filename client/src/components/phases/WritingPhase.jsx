import React, { useState } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import DrawingCanvas from '../DrawingCanvas';

const WritingPhase = () => {
  const { storyParts, socket } = useGame();
  const [content, setContent] = useState('');
  const [inputType, setInputType] = useState('text');

  const submitStoryPart = () => {
    if (!content.trim()) return;
    
    if (inputType === 'text') {
      socket.emit('submit-story-part', content.trim(), 'text');
    } else {
      // For drawing, content should be the data URL from canvas
      socket.emit('submit-story-part', content, 'drawing');
    }
    
    setContent('');
  };

  const startStoryVoting = () => {
    socket.emit('start-phase', 'voting');
  };

  const switchInputType = (type) => {
    setInputType(type);
    setContent('');
  };

  return (
    <div className="phase">
      <h3>Continue the Story</h3>
      
      <div className="current-prompt">
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
        <div className="input-tabs">
          <button
            className={`tab-btn ${inputType === 'text' ? 'active' : ''}`}
            onClick={() => switchInputType('text')}
          >
            Text
          </button>
          <button
            className={`tab-btn ${inputType === 'drawing' ? 'active' : ''}`}
            onClick={() => switchInputType('drawing')}
          >
            Drawing
          </button>
        </div>
        
        <div className="input-content">
          {inputType === 'text' ? (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Continue the story..."
              maxLength="1000"
            />
          ) : (
            <DrawingCanvas
              onContentChange={setContent}
              value={content}
            />
          )}
        </div>
        
        <button onClick={submitStoryPart} className="btn btn-primary">
          Submit Contribution
        </button>
      </div>
      
      <div className="contributions-list">
        <h4>Story Contributions:</h4>
        <div className="contributions-container">
          {storyParts.map(contribution => (
            <div key={contribution.id} className="contribution-item">
              <div className="content">
                {contribution.type === 'drawing' ? (
                  <img src={contribution.content} alt="Drawing" style={{ maxWidth: '100%', height: 'auto' }} />
                ) : (
                  contribution.content
                )}
              </div>
              <div className="votes">{contribution.votes} votes</div>
            </div>
          ))}
        </div>
      </div>
      
      <div className="phase-actions">
        <button
          onClick={startStoryVoting}
          className="btn btn-primary"
          disabled={storyParts.length === 0}
        >
          Vote on Contributions
        </button>
      </div>
    </div>
  );
};

export default WritingPhase;
