import { Link, useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { EmptyState } from '../components/Feedback.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { sampleMaterial } from '../data/sampleMaterial.js';
import { formatDate, wordCount } from '../utils/analytics.js';

export default function Materials() {
  const { materials, addMaterial, deleteMaterial } = useStudy();
  const navigate = useNavigate();

  const handleDelete = (material) => {
    if (window.confirm(`Delete "${material.title}" and all its progress?`)) deleteMaterial(material.id);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Study materials</h1>
          <p className="muted">Everything you have added. Open one to study it.</p>
        </div>
        <Link to="/materials/new" className="btn btn-primary">
          <Icon name="plus" size={16} /> Add material
        </Link>
      </header>

      {materials.length === 0 ? (
        <div className="card">
          <EmptyState icon="library" title="No materials yet" text="Add notes or a PDF to get started.">
            <Link to="/materials/new" className="btn btn-primary">
              Add material
            </Link>
            <button className="btn btn-outline" onClick={() => navigate(`/materials/${addMaterial(sampleMaterial)}`)}>
              Try sample material
            </button>
          </EmptyState>
        </div>
      ) : (
        <div className="grid-3">
          {materials.map((m) => {
            const best = m.attempts.length ? Math.max(...m.attempts.map((a) => a.percent)) : null;
            return (
              <article key={m.id} className="card material-card">
                <div className="material-top">
                  <span className="avatar" aria-hidden="true">
                    {m.title.trim().charAt(0).toUpperCase() || '?'}
                  </span>
                  <div>
                    <h3>{m.title}</h3>
                    <p className="muted small">
                      {wordCount(m.text).toLocaleString()} words · added {formatDate(m.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="chips">
                  <span className={`chip ${m.summary ? 'chip-done' : ''}`}>Summary</span>
                  <span className={`chip ${m.flashcards ? 'chip-done' : ''}`}>Flashcards</span>
                  <span className={`chip ${m.quiz ? 'chip-done' : ''}`}>Quiz</span>
                  {(m.videos || []).length > 0 && <span className="chip chip-primary">{m.videos.length} video(s)</span>}
                </div>

                {best === null ? (
                  <p className="muted small">No quiz attempts yet</p>
                ) : (
                  <p className="small">
                    <span className={`chip ${best >= 80 ? 'chip-success' : best >= 60 ? 'chip-warn' : 'chip-danger'}`}>Best {best}%</span>{' '}
                    <span className="muted">· {m.attempts.length} attempt(s)</span>
                  </p>
                )}

                <div className="card-actions">
                  <Link to={`/materials/${m.id}`} className="btn btn-primary btn-sm">
                    Study
                  </Link>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => handleDelete(m)} aria-label={`Delete ${m.title}`}>
                    <Icon name="trash" size={16} /> Delete
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
