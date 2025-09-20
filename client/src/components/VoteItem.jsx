import React, { useState } from 'react';

const VoteItem = ({ item, onVote }) => {
  const [isSelected, setIsSelected] = useState(false);

  const handleClick = () => {
    setIsSelected(!isSelected);
    onVote(item.id, item.type);
  };

  return (
    <div
      className={`vote-item ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
    >
      <div className="content">
        {item.type === 'drawing' ? (
          <img src={item.content} alt="Drawing" style={{ maxWidth: '100%', height: 'auto' }} />
        ) : (
          item.content
        )}
      </div>
      <div className="votes">{item.votes}</div>
    </div>
  );
};

export default VoteItem;
