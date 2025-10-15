import React, { useCallback } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import RoundOneSummary from '../RoundOneSummary.jsx';

const RoundTwoLeadPhase = () => {
  const { players, roundTwo, isHost, socket } = useGame();
  const leadWriterId = roundTwo?.leadWriterId;
  const turnOrder = roundTwo?.turnOrder || [];
  const completedLeads = roundTwo?.completedLeads || [];

  const resolvePlayerName = useCallback(
    (playerId) => players.find((player) => player.id === playerId)?.name || 'Someone',
    [players]
  );

  const handleSelectLead = useCallback((playerId) => {
    if (!isHost || !socket) return;
    socket.emit('set-round2-lead', playerId);
  }, [isHost, socket]);

  const startCollaboration = useCallback(() => {
    if (!isHost || !socket || !leadWriterId) return;
    socket.emit('start-phase', 'round2_collaboration');
  }, [isHost, socket, leadWriterId]);

  return (
    <div className="phase">
      <h3>Round 2: Choose the Lead Writer</h3>
      <p>
        Pick one player to start the next scene. They will write for two minutes
        while everyone else provides drawings, verbs, or adjectives.
        Once they finish, the next person in the turn order will take over until
        everyone has had a chance to write.
      </p>

      <div className="lead-selection-grid">
        {players.map((player) => {
          const isLead = player.id === leadWriterId;
          return (
            <div
              key={player.id}
              className={`lead-card ${isLead ? 'selected' : ''}`}
            >
              <div className="lead-name">
                {player.name}
                {player.isHost && <span className="lead-role">Host</span>}
              </div>
              <div className="lead-actions">
                {isLead ? (
                  <span className="lead-badge">Lead Writer</span>
                ) : (
                  isHost && (
                    <button
                      className="btn btn-secondary btn-small"
                      onClick={() => handleSelectLead(player.id)}
                    >
                      Assign Lead
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isHost ? (
        <div className="phase-actions">
          <button
            className="btn btn-primary"
            onClick={startCollaboration}
            disabled={!leadWriterId}
          >
            Start Collaboration (2 min)
          </button>
        </div>
      ) : (
        leadWriterId && (
          <div className="phase-actions">
                <span className="info-pill">
              {resolvePlayerName(leadWriterId)} is about to lead the writing.
            </span>
          </div>
        )
      )}

      {turnOrder.length > 0 && (
        <div className="turn-order-preview">
          <h4>Turn Order</h4>
          <ol>
            {turnOrder.map((id) => {
              const label = resolvePlayerName(id);
              const isActive = id === leadWriterId;
              const isDone = completedLeads.includes(id);
              return (
                <li
                  key={id}
                  className={`${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                >
                  {label}
                  {isActive && <span className="order-pill">Writing now</span>}
                  {!isActive && !isDone && <span className="order-pill upcoming">Up next</span>}
                  {isDone && <span className="order-pill done">Done</span>}
                </li>
              );
            })}
          </ol>
          <p className="hint small">
            The rotation continues until the final player finishes their turn.
          </p>
        </div>
      )}
      <RoundOneSummary showTheme={false} heading="Round 1 Contributions" />
    </div>
  );
};

export default RoundTwoLeadPhase;
