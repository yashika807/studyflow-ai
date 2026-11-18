import { useState } from 'react';
import Icon from './Icon.jsx';

// `cards` is an array of { front, back, topic, known, index } where `index`
// is the position of the card inside the material (used to save progress).
export default function Flashcards({ cards, onToggleKnown }) {
  const [current, setCurrent] = useState(0);
  const [flipped, setFlipped] = useState(false);

  if (cards.length === 0) return <p className="muted">No flashcards here yet.</p>;

  const position = Math.min(current, cards.length - 1);
  const card = cards[position];
  const knownCount = cards.filter((c) => c.known).length;

  const go = (step) => {
    setFlipped(false);
    setCurrent((position + step + cards.length) % cards.length);
  };

  return (
    <div className="deck">
      <div className="deck-top">
        <span className="muted">
          Card {position + 1} of {cards.length}
        </span>
        <span className="chip">{card.topic}</span>
      </div>

      <button className={`flip${flipped ? ' is-flipped' : ''}`} onClick={() => setFlipped(!flipped)} aria-label="Flip card">
        <span className="flip-inner">
          <span className="flip-face flip-front">
            <small>Question</small>
            {card.front}
            <em>Click to reveal answer</em>
          </span>
          <span className="flip-face flip-back">
            <small>Answer</small>
            {card.back}
          </span>
        </span>
      </button>

      <div className="deck-actions">
        <button className="btn btn-ghost" onClick={() => go(-1)}>
          Previous
        </button>
        <button className={`btn ${card.known ? 'btn-success' : 'btn-outline'}`} onClick={() => onToggleKnown(card.index, !card.known)}>
          <Icon name="check" size={16} /> {card.known ? 'Marked as known' : 'I know this'}
        </button>
        <button className="btn btn-ghost" onClick={() => go(1)}>
          Next
        </button>
      </div>

      <div className="progress-row">
        <div className="bar">
          <div className="bar-fill" style={{ width: `${(knownCount / cards.length) * 100}%` }} />
        </div>
        <span className="muted">
          {knownCount}/{cards.length} known
        </span>
      </div>
    </div>
  );
}
