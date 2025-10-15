import React, { useMemo } from 'react';
import { useGame } from '../../context/GameContext.jsx';

const CompletePhase = ({ onNewGame }) => {
  const { roundTwo, storyParts } = useGame();
  const segments = roundTwo?.segments || [];

  const exportStory = () => {
    const narrative = segments.length
      ? segments
          .map((segment) =>
            segment.content && segment.content.trim().length
              ? segment.content.trim()
              : '— No text submitted —'
          )
          .join('\n\n')
      : storyParts.map(part => {
          if (part.type === 'drawing') {
            return '[Drawing]';
          }
          return part.content;
        }).join('\n\n');
    
    const blob = new Blob([narrative], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gnomies-story.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hasSegments = segments.length > 0;
  const combinedStory = useMemo(() => {
    if (!hasSegments) return '';
    return segments
      .map((segment) =>
        segment.content && segment.content.trim().length
          ? segment.content.trim()
          : '— No text submitted —'
      )
      .join('\n\n');
  }, [hasSegments, segments]);

  return (
    <div className="phase">
      <h3>🎉 Story Complete!</h3>
      
      <div className="final-story">
        <h4>The Final Story:</h4>
        <div className="story-display">
          {hasSegments ? (
            <div className="combined-story">{combinedStory}</div>
          ) : (
            storyParts.map(part => (
              <div key={part.id} className="story-part">
                {part.type === 'drawing' ? (
                  <img
                    src={part.content}
                    alt="Drawing"
                    style={{ maxWidth: '100%', height: 'auto' }}
                  />
                ) : (
                  part.content
                )}
              </div>
            ))
          )}
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
