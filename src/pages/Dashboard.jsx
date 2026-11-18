import { Link, useNavigate } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Icon from '../components/Icon.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { sampleMaterial } from '../data/sampleMaterial.js';
import { aggregateTopics, formatDate, getNextSteps, getOverallStats, getScoreTrend, WEAK_THRESHOLD } from '../utils/analytics.js';

const FLOW = [
  { title: 'Understand', text: 'Summary & key points' },
  { title: 'Practice', text: 'Flashcards & quizzes' },
  { title: 'Find weak areas', text: 'Topic-wise analysis' },
  { title: 'Revise', text: 'Targeted revision' },
];

const GOOD = '#16a34a';
const WEAK = '#dc2626';
const PRIMARY = '#5b5bd6';

function StatCard({ label, value, hint }) {
  return (
    <div className="card stat">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
      <span className="muted small">{hint}</span>
    </div>
  );
}

export default function Dashboard() {
  const { materials, addMaterial } = useStudy();
  const navigate = useNavigate();

  const stats = getOverallStats(materials);
  const topics = aggregateTopics(materials);
  const trend = getScoreTrend(materials);
  const steps = getNextSteps(materials);

  const trySample = () => navigate(`/materials/${addMaterial(sampleMaterial)}`);

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Turn what you read into what you know.</p>
        </div>
        <Link to="/materials/new" className="btn btn-primary">
          <Icon name="plus" size={16} /> Add material
        </Link>
      </header>

      <ol className="flow">
        {FLOW.map((step, i) => (
          <li key={step.title}>
            <span className="flow-num">{i + 1}</span>
            <div>
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
            <StatCard label="Materials" value={stats.materials} hint="added so far" />
            <StatCard label="Quizzes taken" value={stats.quizzes} hint="attempts in total" />
            <StatCard label="Average score" value={stats.avgScore === null ? '—' : `${stats.avgScore}%`} hint="across all quizzes" />
            <StatCard label="Flashcards known" value={`${stats.cardsKnown}/${stats.cardsTotal}`} hint="marked as known" />
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
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7ef" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(v) => [`${v}%`, 'Score']} labelFormatter={(label, items) => items[0]?.payload.title || label} />
                      <Line type="monotone" dataKey="percent" stroke={PRIMARY} strokeWidth={3} dot={{ r: 4 }} />
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7ef" horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="topic" width={110} tick={{ fontSize: 12 }} />
                        <Tooltip formatter={(v) => [`${v}%`, 'Accuracy']} />
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

          <section className="grid-2">
            <div className="card">
              <h3>What to do next</h3>
              {steps.length === 0 ? (
                <p className="muted">You are all caught up. Add more material or retake a quiz to keep improving.</p>
              ) : (
                <ul className="step-list">
                  {steps.map((s) => (
                    <li key={s.id}>
                      <span className="chip">{s.label}</span>
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
