import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import ChatBot from '../components/ChatBot.jsx';
import Icon from '../components/Icon.jsx';
import UpcomingExams from '../components/UpcomingExams.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { sampleMaterial } from '../data/sampleMaterial.js';
import { aggregateTopics, formatDate, getNextSteps, getOverallStats, getScoreTrend, getWeakTopics, WEAK_THRESHOLD } from '../utils/analytics.js';

const FLOW = [
  { title: 'Understand', text: 'Summary & key points', icon: 'file' },
  { title: 'Practice', text: 'Flashcards & quizzes', icon: 'layers' },
  { title: 'Find weak areas', text: 'Topic-wise analysis', icon: 'target' },
  { title: 'Revise', text: 'Targeted revision', icon: 'refresh' },
];

// Colours are CSS variables so the charts follow light / dark mode.
const GOOD = 'var(--success-line)';
const WEAK = 'var(--danger)';
const PRIMARY = 'var(--primary)';
const tooltipStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--text)',
  boxShadow: 'var(--shadow)',
};

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="card stat">
      <span className={`stat-icon tone-${tone}`}>
        <Icon name={icon} size={22} />
      </span>
      <div>
        <span className="muted small">{label}</span>
        <strong>{value}</strong>
        <span className="muted small">{hint}</span>
      </div>
    </div>
  );
}

function heroText(materialCount, weakCount) {
  if (materialCount === 0) {
    return { title: 'Welcome to StudyFlow', text: 'Add your first notes or PDF and turn them into summaries, quizzes and a revision plan.' };
  }
  if (weakCount > 0) {
    return { title: 'Time for a quick revision', text: `You have ${weakCount} weak topic${weakCount > 1 ? 's' : ''}. A short revision session will lift your next score.` };
  }
  return { title: 'Keep the momentum going', text: 'Add new material or retake a quiz to keep your knowledge sharp.' };
}

export default function Dashboard() {
  const { materials, addMaterial } = useStudy();
  const navigate = useNavigate();

  const stats = getOverallStats(materials);
  const topics = aggregateTopics(materials);
  const trend = getScoreTrend(materials);
  const steps = getNextSteps(materials);
  const weakCount = getWeakTopics(materials).length;
  const hero = heroText(materials.length, weakCount);

  const trySample = () => navigate(`/materials/${addMaterial(sampleMaterial)}`);

  return (
    <div className="page">
      <section className="hero">
        <div>
          <h1>{hero.title}</h1>
          <p>{hero.text}</p>
        </div>
        <div className="hero-actions">
          <Link to="/materials/new" className="btn btn-white">
            <Icon name="plus" size={16} /> Add material
          </Link>
          {weakCount > 0 && (
            <Link to="/revise" className="btn btn-glass">
              Revise weak topics
            </Link>
          )}
        </div>
      </section>

      <ol className="flow">
        {FLOW.map((step, i) => (
          <li key={step.title}>
            <span className="flow-icon">
              <Icon name={step.icon} size={18} />
            </span>
            <div>
              <small>Step {i + 1}</small>
              <strong>{step.title}</strong>
              <span className="muted small">{step.text}</span>
            </div>
          </li>
        ))}
      </ol>

      {materials.length === 0 ? (
        <div className="card">
          <EmptyState icon="upload" title="Start with your first study material" text="Paste your notes or upload a PDF. StudyFlow will summarise it, quiz you and tell you what to revise.">
            <Link to="/materials/new" className="btn btn-primary">
              Add material
            </Link>
            <button className="btn btn-outline" onClick={trySample}>
              Try sample material
            </button>
          </EmptyState>
        </div>
      ) : (
        <>
          <section className="grid-4">
            <StatCard label="Materials" value={stats.materials} hint="added so far" icon="library" tone="primary" />
            <StatCard label="Quizzes taken" value={stats.quizzes} hint="attempts in total" icon="target" tone="violet" />
            <StatCard label="Average score" value={stats.avgScore === null ? '—' : `${stats.avgScore}%`} hint="across all quizzes" icon="chart" tone="success" />
            <StatCard label="Flashcards known" value={`${stats.cardsKnown}/${stats.cardsTotal}`} hint="marked as known" icon="layers" tone="warn" />
          </section>

          <section className="grid-2">
            <div className="card">
              <h3>Quiz score trend</h3>
              {trend.length === 0 ? (
                <p className="muted">Take a quiz to see your scores over time.</p>
              ) : (
                <div className="chart-box">
                  <ResponsiveContainer width="100%" height={230}>
                    <LineChart data={trend} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(label, items) => items[0]?.payload.title || label} />
                      <Line type="monotone" dataKey="percent" stroke={PRIMARY} strokeWidth={3} dot={{ r: 4, fill: PRIMARY }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            <div className="card">
              <h3>Topic accuracy</h3>
              {topics.length === 0 ? (
                <p className="muted">Your strong and weak topics will appear after your first quiz.</p>
              ) : (
                <>
                  <div className="chart-box">
                    <ResponsiveContainer width="100%" height={Math.min(topics.length, 6) * 40 + 30}>
                      <BarChart data={topics.slice(0, 6)} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="topic" width={110} tick={{ fontSize: 12 }} />
                        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--surface-2)' }} formatter={(v) => [`${v}%`, 'Accuracy']} />
                        <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                          {topics.slice(0, 6).map((t) => (
                            <Cell key={`${t.materialId}-${t.topic}`} fill={t.accuracy < WEAK_THRESHOLD ? WEAK : GOOD} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="muted small">
                    <span className="dot weak" /> weak (below {WEAK_THRESHOLD}%) <span className="dot strong" /> strong
                  </p>
                </>
              )}
            </div>
          </section>
        </>
      )}

      <section className="grid-chat">
        <ChatBot />
        <UpcomingExams />
      </section>

      {materials.length > 0 && (
        <>
          <section className="grid-2">
            <div className="card">
              <h3>What to do next</h3>
              {steps.length === 0 ? (
                <p className="muted">You are all caught up. Add more material or retake a quiz to keep improving.</p>
              ) : (
                <ul className="step-list">
                  {steps.map((s) => (
                    <li key={s.id}>
                      <span className="chip chip-primary">{s.label}</span>
                      <span>{s.text}</span>
                      <Link to={s.to} className="icon-link" aria-label="Go">
                        <Icon name="arrow" size={18} />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="card">
              <h3>Recent materials</h3>
              <ul className="step-list">
                {materials.slice(0, 4).map((m) => (
                  <li key={m.id}>
                    <span>
                      <strong>{m.title}</strong>
                      <br />
                      <span className="muted small">Added {formatDate(m.createdAt)}</span>
                    </span>
                    <Link to={`/materials/${m.id}`} className="icon-link" aria-label={`Open ${m.title}`}>
                      <Icon name="arrow" size={18} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
