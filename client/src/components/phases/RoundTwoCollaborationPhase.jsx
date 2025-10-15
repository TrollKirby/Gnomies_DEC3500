import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useGame } from '../../context/GameContext.jsx';
import RoundOneSummary from '../RoundOneSummary.jsx';

const SUPPORT_OPTIONS = [
  { key: 'verbs', label: 'Add Verb / Action' },
  { key: 'adjectives', label: 'Add Adjective' },
  { key: 'drawings', label: 'Share Drawing' }
];

const RoundTwoCollaborationPhase = () => {
  const {
    roundTwo,
    playerId,
    players,
    socket,
    timeRemaining,
    timeExtensions,
    maxTimeExtensions,
    isHost
  } = useGame();

  const leadWriterId = roundTwo?.leadWriterId;
  const isLeadWriter = playerId === leadWriterId;
  const turnOrder = roundTwo?.turnOrder || [];
  const completedLeads = roundTwo?.completedLeads || [];

  const [writingDraft, setWritingDraft] = useState(roundTwo?.writing || '');
  const [supportCategory, setSupportCategory] = useState('verbs');
  const [supportText, setSupportText] = useState('');
  const [lastSaved, setLastSaved] = useState(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawing, setHasDrawing] = useState(false);
  const autoSaveTimer = useRef(null);

  const resolvePlayerName = useCallback(
    (id) => players.find((player) => player.id === id)?.name || 'Someone',
    [players]
  );

  useEffect(() => {
    setWritingDraft(roundTwo?.writing || '');
  }, [roundTwo?.writing]);

  const timeRemainingDisplay = useMemo(() => {
    const seconds = Math.max(0, Math.floor(timeRemaining / 1000));
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, [timeRemaining]);

  const handleSaveWriting = useCallback(() => {
    if (!socket) return;
    socket.emit('submit-round2-writing', writingDraft);
    if (isLeadWriter) {
      socket.emit('complete-round2-turn');
    }
    setLastSaved(new Date());
  }, [socket, writingDraft, isLeadWriter]);

  const scheduleAutoSave = useCallback((draft) => {
    if (!socket || !isLeadWriter) return;
    if (autoSaveTimer.current) {
      clearTimeout(autoSaveTimer.current);
    }
    autoSaveTimer.current = setTimeout(() => {
      socket.emit('submit-round2-writing', draft);
      setLastSaved(new Date());
      autoSaveTimer.current = null;
    }, 800);
  }, [socket, isLeadWriter]);

  useEffect(() => {
    return () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        autoSaveTimer.current = null;
      }
    };
  }, []);

  const handleDraftChange = useCallback((event) => {
    const value = event.target.value;
    setWritingDraft(value);
    scheduleAutoSave(value);
  }, [scheduleAutoSave]);

  const handleSupportSubmit = useCallback(() => {
    if (!socket || !supportText.trim()) return;
    socket.emit('submit-round2-support', supportCategory, supportText.trim());
    setSupportText('');
  }, [socket, supportCategory, supportText]);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.beginPath();
    setHasDrawing(false);
  }, []);

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#333333';
    return ctx;
  }, []);

  const getCanvasCoords = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX) ?? 0;
    const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY) ?? 0;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const handlePointerDown = useCallback((event) => {
    if (supportCategory !== 'drawings') return;
    event.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCanvasCoords(event);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setHasDrawing(true);
    setIsDrawing(true);
  }, [getCanvasContext, getCanvasCoords, supportCategory]);

  const handlePointerMove = useCallback((event) => {
    if (!isDrawing || supportCategory !== 'drawings') return;
    event.preventDefault();
    const ctx = getCanvasContext();
    if (!ctx) return;
    const { x, y } = getCanvasCoords(event);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawing(true);
  }, [getCanvasContext, getCanvasCoords, isDrawing, supportCategory]);

  const handlePointerUp = useCallback((event) => {
    if (supportCategory !== 'drawings') return;
    event.preventDefault();
    if (isDrawing) {
      const ctx = getCanvasContext();
      ctx?.closePath();
    }
    setIsDrawing(false);
  }, [getCanvasContext, isDrawing, supportCategory]);

  const handleShareDrawing = useCallback(() => {
    if (!socket || supportCategory !== 'drawings') return;
    const canvas = canvasRef.current;
    if (!canvas || !hasDrawing) return;
    const dataUrl = canvas.toDataURL('image/png');
    socket.emit('submit-round2-support', 'drawings', dataUrl);
    clearCanvas();
  }, [socket, supportCategory, hasDrawing, clearCanvas]);

  const displayName = useMemo(() => {
    const lead = players.find((p) => p.id === leadWriterId);
    return lead ? lead.name : 'Lead Writer';
  }, [players, leadWriterId]);

  const supportEntries = roundTwo?.support || { verbs: [], adjectives: [], drawings: [] };

  const canExtendTime = isHost && timeExtensions < maxTimeExtensions;
  const requestExtension = useCallback(() => {
    if (!socket || !canExtendTime) return;
    socket.emit('request-time-extension');
  }, [socket, canExtendTime]);

  const hasLead = Boolean(leadWriterId);
  const canFinishTurn = hasLead && (isLeadWriter || isHost);
  const handleFinishTurn = useCallback(() => {
    if (!socket || !canFinishTurn) return;
    socket.emit('complete-round2-turn');
  }, [socket, canFinishTurn]);

  return (
    <div className="phase">
      <h3>Round 2: Collaboration Sprint</h3>
      <p>
        {displayName} is drafting the next scene. Everyone else feeds verbs, adjectives, or sketches,
        and the lead can tap <strong>Save &amp; Pass</strong> to hand the story to the next writer—
        otherwise the timer will advance automatically.
      </p>

      <div className="round-two-meta">
        <div className="time-pill">
          ⏱ Remaining: <strong>{timeRemainingDisplay}</strong>
        </div>
        {canExtendTime && (
          <button className="btn btn-secondary btn-small" onClick={requestExtension}>
            +60s Extension ({maxTimeExtensions - timeExtensions} left)
          </button>
        )}
      </div>

      <div className="round-two-layout">
        <div className="round-two-primary">
          <h4>Lead Writer: {displayName}</h4>
          {isLeadWriter ? (
            <>
              <textarea
                value={writingDraft}
                onChange={handleDraftChange}
                placeholder="Type the scene here..."
                maxLength={1000}
              />
              <div className="lead-actions">
                <button className="btn btn-primary" onClick={handleSaveWriting}>
                  Save &amp; Pass
                </button>
                {lastSaved && (
                  <span className="save-note">
                    Saved at {lastSaved.toLocaleTimeString()}
                  </span>
                )}
              </div>
            </>
          ) : (
            <div className="lead-text-preview">
              <p className="hint">
                Waiting on {displayName}. Keep sharing verbs, adjectives, or a quick sketch!
              </p>
              <div className="story-preview">
                {roundTwo?.writing ? roundTwo.writing : 'No writing submitted yet.'}
              </div>
              {isHost && canFinishTurn && (
                <button className="btn btn-secondary btn-small" onClick={handleFinishTurn}>
                  Advance to Next Writer
                </button>
              )}
            </div>
          )}
        </div>

        <div className="round-two-support">
          <h4>Support Actions</h4>
          <div className="support-buttons">
            {SUPPORT_OPTIONS.map((option) => (
              <button
                key={option.key}
                className={`support-btn ${supportCategory === option.key ? 'active' : ''}`}
                onClick={() => setSupportCategory(option.key)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {supportCategory === 'drawings' ? (
            <div className="drawing-panel">
              <canvas
                ref={canvasRef}
                width={360}
                height={240}
                className="drawing-canvas"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
              />
              <div className="drawing-controls">
                <button className="btn btn-secondary btn-small" onClick={clearCanvas} disabled={!hasDrawing && !isDrawing}>
                  Clear
                </button>
                <button
                  className="btn btn-primary btn-small"
                  onClick={handleShareDrawing}
                  disabled={!hasDrawing}
                >
                  Share Drawing
                </button>
              </div>
              <p className="hint small">
                Draw directly in the canvas and share when you&apos;re ready. The lead writer sees your sketch instantly.
              </p>
            </div>
          ) : (
            <>
              <textarea
                value={supportText}
                onChange={(e) => setSupportText(e.target.value)}
                placeholder="Add a quick suggestion..."
                maxLength={200}
              />
              <button className="btn btn-secondary" onClick={handleSupportSubmit}>
                Submit Support
              </button>
            </>
          )}

          <div className="support-lists">
            {SUPPORT_OPTIONS.map((option) => (
              <div key={option.key} className="support-group">
                <h5>{option.label}</h5>
                {supportEntries[option.key]?.length ? (
                  <ul>
                    {supportEntries[option.key].map((entry) => (
                      <li key={entry.id}>
                        <span className="support-name">{entry.playerName}:</span>{' '}
                        {option.key === 'drawings' && typeof entry.content === 'string' && entry.content.startsWith('data:image') ? (
                          <img
                            src={entry.content}
                            alt={`Drawing from ${entry.playerName}`}
                            className="support-drawing-preview"
                          />
                        ) : (
                          <span>{entry.content}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-note">No {option.label.toLowerCase()} yet.</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {turnOrder.length > 0 && (
        <div className="turn-order-panel">
          <h4>Turn Progress</h4>
          <ol>
            {turnOrder.map((id) => {
              const name = resolvePlayerName(id);
              const isActive = id === leadWriterId;
              const isDone = completedLeads.includes(id);
              return (
                <li
                  key={id}
                  className={`${isActive ? 'active' : ''} ${isDone ? 'completed' : ''}`}
                >
                  <span>{name}</span>
                  {isActive && <span className="order-pill">Writing now</span>}
                  {!isActive && !isDone && <span className="order-pill upcoming">Up next</span>}
                  {isDone && <span className="order-pill done">Done</span>}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <RoundOneSummary />
    </div>
  );
};

export default RoundTwoCollaborationPhase;
