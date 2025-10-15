import React, { useMemo } from 'react';
import { useGame } from '../context/GameContext.jsx';

const RoundOneSummary = ({ showTheme = true, heading = 'Round 1 Story Seeds' }) => {
  const { roundOne, selectedTheme } = useGame();

  const sections = useMemo(
    () => [
      {
        key: 'setting',
        title: 'Setting Ideas',
        entries: roundOne?.settingSubmissions || [],
        emptyMessage: 'No settings submitted yet.'
      },
      {
        key: 'character1',
        title: 'Character 1 Concepts',
        entries: roundOne?.characterSubmissions?.character1 || [],
        emptyMessage: 'No character concepts submitted yet.'
      },
      {
        key: 'character2',
        title: 'Character 2 Concepts',
        entries: roundOne?.characterSubmissions?.character2 || [],
        emptyMessage: 'No character concepts submitted yet.'
      }
    ],
    [roundOne]
  );

  const hasAnySubmissions = useMemo(
    () => sections.some((section) => section.entries.length > 0),
    [sections]
  );

  if (!hasAnySubmissions) {
    return (
      <div className="round-one-summary">
        <h4>{heading}</h4>
        <p>No submissions captured during Round 1 yet.</p>
      </div>
    );
  }

  return (
    <div className="round-one-summary">
      <h4>{heading}</h4>
      {showTheme && selectedTheme && (
        <p className="round-summary-theme">
          Theme: <strong>{selectedTheme}</strong>
        </p>
      )}

      {sections.map((section) => (
        <section className="round-summary-section" key={section.key}>
          <h5>{section.title}</h5>
          {section.entries.length === 0 ? (
            <p>{section.emptyMessage}</p>
          ) : (
            <div className="submissions-grid">
              {section.entries.map((entry, index) => (
                <div key={entry.playerId || index} className="submission-card">
                  <div className="submission-author">
                    Contribution {index + 1}
                  </div>
                  <div className="submission-content">{entry.content}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

export default RoundOneSummary;
