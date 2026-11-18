import { WEAK_THRESHOLD } from '../utils/analytics.js';

// Horizontal accuracy bars. Red = weak topic, green = strong.
export default function TopicBars({ topics }) {
  return (
    <ul className="topic-bars">
      {topics.map((t) => {
        const weak = t.accuracy < WEAK_THRESHOLD;
        return (
          <li key={t.topic}>
            <div className="topic-bars-head">
              <span>{t.topic}</span>
              <span className="muted">
                {t.correct}/{t.total} · {t.accuracy}%
              </span>
            </div>
            <div className="bar">
              <div className={`bar-fill ${weak ? 'weak' : 'strong'}`} style={{ width: `${t.accuracy}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
