import React from 'react';
import { useGame } from '../../context/GameContext.jsx';
import VoteItem from '../VoteItem';

const VotingPhase = () => {
  const { narrativeElements, storyParts, alternativeEndings, socket } = useGame();

  const getVotingItems = () => {
    if (narrativeElements && narrativeElements.length > 0) {
      return narrativeElements.map(item => ({
        ...item,
        type: 'narrative',
        content: item.element
      }));
    } else if (storyParts && storyParts.length > 0) {
      return storyParts.map(item => ({
        ...item,
        type: 'story',
        content: item.content
      }));
    } else if (alternativeEndings && alternativeEndings.length > 0) {
      return alternativeEndings.map(item => ({
        ...item,
        type: 'ending',
        content: item.ending
      }));
    }
    return [];
  };

  const handleVote = (targetId, targetType) => {
    socket.emit('vote', targetId, targetType);
  };

  const getPhaseTitle = () => {
    if (narrativeElements && narrativeElements.length > 0) {
      return 'Vote on Narrative Elements';
    } else if (storyParts && storyParts.length > 0) {
      return 'Vote on Story Contributions';
    } else if (alternativeEndings && alternativeEndings.length > 0) {
      return 'Choose the Best Ending';
    }
    return 'Vote';
  };

  const getPhaseDescription = () => {
    if (narrativeElements && narrativeElements.length > 0) {
      return 'Vote for your favorite elements. The top 3 will guide the story.';
    } else if (storyParts && storyParts.length > 0) {
      return 'Vote for the best continuation of the story.';
    } else if (alternativeEndings && alternativeEndings.length > 0) {
      return 'Vote for your favorite ending to complete the story.';
    }
    return 'Cast your vote.';
  };

  const getNextPhaseAction = () => {
    if (narrativeElements && narrativeElements.length > 0) {
      return () => socket.emit('start-phase', 'prompting');
    } else if (storyParts && storyParts.length > 0) {
      return () => socket.emit('start-phase', 'alternative_endings');
    } else if (alternativeEndings && alternativeEndings.length > 0) {
      return () => socket.emit('start-phase', 'complete');
    }
    return null;
  };

  const getNextPhaseButtonText = () => {
    if (narrativeElements && narrativeElements.length > 0) {
      return 'Finalize Selection';
    } else if (storyParts && storyParts.length > 0) {
      return 'Continue Story';
    } else if (alternativeEndings && alternativeEndings.length > 0) {
      return 'Complete Story';
    }
    return 'Continue';
  };

  const votingItems = getVotingItems();
  const nextAction = getNextPhaseAction();

  return (
    <div className="phase">
      <h3>{getPhaseTitle()}</h3>
      <p>{getPhaseDescription()}</p>
      
      <div className="voting-grid">
        {votingItems.map(item => (
          <VoteItem
            key={item.id}
            item={item}
            onVote={handleVote}
          />
        ))}
      </div>
      
      {nextAction && (
        <div className="phase-actions">
          <button onClick={nextAction} className="btn btn-primary">
            {getNextPhaseButtonText()}
          </button>
        </div>
      )}
    </div>
  );
};

export default VotingPhase;
