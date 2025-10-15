import React, { useEffect, useMemo, useState } from 'react';
import { useGame, DEFAULT_THEME_OPTIONS } from '../../context/GameContext.jsx';

const ThemeSelectionPhase = () => {
  const {
    themeOptions = DEFAULT_THEME_OPTIONS,
    themeVoteCounts = {},
    themeVotes = [],
    selectedTheme,
    socket,
    isHost,
    players,
    playerId
  } = useGame();

  const [localSelection, setLocalSelection] = useState(null);

  useEffect(() => {
    if (selectedTheme) {
      setLocalSelection(selectedTheme);
    }
  }, [selectedTheme]);

  const handleVote = (option) => {
    if (!socket) return;
    setLocalSelection(option);
    socket.emit('vote-theme', option);
  };

  const finalizeTheme = () => {
    if (!socket) return;
    socket.emit('finalize-theme');
  };

  const baseOptions = useMemo(
    () => (themeOptions && themeOptions.length ? themeOptions : DEFAULT_THEME_OPTIONS),
    [themeOptions]
  );

  const counts = useMemo(() => {
    const aggregate = baseOptions.reduce((acc, option) => {
      acc[option] = 0;
      return acc;
    }, {});

    const sourceVotes = themeVotes.length
      ? themeVotes
      : Object.entries(themeVoteCounts).flatMap(([theme, count]) =>
          Array.from({ length: count }, () => ({ theme }))
        );

    sourceVotes.forEach(({ theme }) => {
      if (theme && aggregate[theme] !== undefined) {
        aggregate[theme] += 1;
      }
    });

    return aggregate;
  }, [baseOptions, themeVoteCounts, themeVotes]);

  const myServerVote = useMemo(() => {
    const record = themeVotes.find((vote) => vote.playerId === playerId);
    return record?.theme || null;
  }, [themeVotes, playerId]);

  useEffect(() => {
    if (myServerVote) {
      setLocalSelection(myServerVote);
    }
  }, [myServerVote]);

  const displayCounts = useMemo(() => {
    const result = { ...counts };
    if (localSelection && myServerVote !== localSelection) {
      result[localSelection] = (result[localSelection] || 0) + 1;
    }
    return result;
  }, [counts, localSelection, myServerVote]);

  const totalVotes = useMemo(
    () => Object.values(displayCounts).reduce((sum, value) => sum + value, 0),
    [displayCounts]
  );

  return (
    <div className="phase">
      <h3>Choose the Story Theme</h3>
      <p>
        Pick the mood for this adventure. Vote for your favorite genre and the
        host will lock in the top choice.
      </p>

      <div className="theme-vote-summary">
        {baseOptions.map((option) => (
          <div key={option} className="summary-item">
            <span>{option}</span>
            <span className="summary-count">
              {displayCounts[option] || 0}
            </span>
          </div>
        ))}
      </div>

      <div className="theme-selection-grid">
        {baseOptions.map((option) => {
          const voteCount = displayCounts[option] || 0;
          const isSelected =
            localSelection === option ||
            selectedTheme === option ||
            myServerVote === option;
          return (
            <button
              key={option}
              className={`btn theme-button ${isSelected ? 'selected' : ''}`}
              onClick={() => handleVote(option)}
            >
              <span className="label">{option}</span>
              <span className="votes">
                {voteCount} vote{voteCount === 1 ? '' : 's'}
              </span>
            </button>
          );
        })}
      </div>

      <div className="theme-status">
        <span>{totalVotes} total vote{totalVotes === 1 ? '' : 's'}</span>
        {selectedTheme && (
          <span className="selected-theme">
            Selected Theme: <strong>{selectedTheme}</strong>
          </span>
        )}
      </div>

      {isHost && (
        <div className="phase-actions">
          <button
            onClick={finalizeTheme}
            className="btn btn-primary"
            disabled={players.length === 0 || totalVotes === 0}
          >
            Finalize Theme
          </button>
        </div>
      )}
    </div>
  );
};

export default ThemeSelectionPhase;
