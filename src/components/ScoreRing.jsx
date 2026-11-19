// Circular score indicator that animates from 0 to the score.
export default function ScoreRing({ percent, tone, size = 104 }) {
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className={`ring ${tone}`} style={{ width: size, height: size }} role="img" aria-label={`Score ${percent}%`}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle className="ring-track" cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} />
        <circle
          className="ring-value"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{ '--circ': circumference }}
        />
      </svg>
      <span>{percent}%</span>
    </div>
  );
}
