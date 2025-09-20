import React from 'react';

const Timer = ({ timeRemaining, onTimeExtension, canExtend }) => {
  const formatTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="timer-container">
      <div className="timer">
        {formatTime(timeRemaining)}
      </div>
      <button
        onClick={onTimeExtension}
        className="btn btn-small"
        disabled={!canExtend}
      >
        +1min
      </button>
    </div>
  );
};

export default Timer;
