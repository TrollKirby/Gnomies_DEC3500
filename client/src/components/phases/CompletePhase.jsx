import React from 'react';
import { useGame } from '../../context/GameContext.jsx';

const CompletePhase = ({ onNewGame }) => {
  const { storyParts } = useGame();

  const exportStory = () => {
    const story = storyParts.map(part => {
      if (part.type === 'drawing') {
        return '[Drawing]';
      }
      return part.content;
    }).join('\n\n');
    
    const blob = new Blob([story], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gnomies-story.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="phase">
      <h3>🎉 Story Complete!</h3>
      
      <div className="final-story">
        <h4>The Final Story:</h4>
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
      
      <div className="phase-actions">
        <button onClick={onNewGame} className="btn btn-primary">
          Start New Game
        </button>
        <button onClick={exportStory} className="btn btn-secondary">
          Export Story
        </button>
      </div>
    </div>
  );
};

export default CompletePhase;
