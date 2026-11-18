import { useState } from 'react';
import { Link } from 'react-router-dom';
import Flashcards from '../components/Flashcards.jsx';
import { EmptyState, ErrorBox, Loader } from '../components/Feedback.jsx';
import Icon from '../components/Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { explainConcept } from '../services/gemini.js';
import { aggregateTopics, WEAK_THRESHOLD } from '../utils/analytics.js';
import { youTubeWatchUrl } from '../utils/youtube.js';

export default function Revise() {
  const { materials, apiKey, setCardKnown } = useStudy();
  const [open, setOpen] = useState({}); // which topic cards show their flashcards
  const [explanations, setExplanations] = useState({});
  const [loadingKey, setLoadingKey] = useState(null);
  const [error, setError] = useState(null);

  const allTopics = aggregateTopics(materials);
  const weak = allTopics.filter((t) => t.accuracy < WEAK_THRESHOLD);
  const strong = allTopics.filter((t) => t.accuracy >= WEAK_THRESHOLD);

  const explain = async (t, key) => {
    const material = materials.find((m) => m.id === t.materialId);
    setLoadingKey(key);
    setError(null);
    try {
      const result = await explainConcept(material.text, t.topic, apiKey);
      setExplanations((prev) => ({ ...prev, [key]: result }));
    } catch (err) {
      setError(err);
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Revision plan</h1>
          <p className="muted">Topics where you scored below {WEAK_THRESHOLD}% in your recent quizzes, weakest first.</p>
        </div>
      </header>

      {allTopics.length === 0 ? (
        <div className="card">
          <EmptyState icon="chart" title="Nothing to revise yet" text="Take a quiz on any material. StudyFlow will find the topics you struggle with and list them here.">
            <Link to="/materials" className="btn btn-primary">
              Go to materials
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          <ErrorBox error={error} />

          {weak.length === 0 ? (
            <div className="alert alert-success">No weak topics right now. Keep practising to stay sharp!</div>
          ) : (
            <div className="stack">
              {weak.map((t) => {
                const key = `${t.materialId}-${t.topic}`;
                const material = materials.find((m) => m.id === t.materialId);
                const cards = (material.flashcards || []).map((c, i) => ({ ...c, index: i })).filter((c) => c.topic === t.topic);
                const explanation = explanations[key];
                const topicVideos = (material.videos || []).filter((v) => v.topic === t.topic);

                return (
                  <article key={key} className="card revise-card">
                    <div className="revise-head">
                      <div>
                        <h3>{t.topic}</h3>
                        <p className="muted small">{t.materialTitle}</p>
                      </div>
                      <span className="chip chip-danger">
                        {t.accuracy}% · {t.correct}/{t.total} correct
                      </span>
                    </div>

                    <div className="bar">
                      <div className="bar-fill weak" style={{ width: `${t.accuracy}%` }} />
                    </div>

                    <div className="row-gap">
                      <button className="btn btn-outline btn-sm" onClick={() => explain(t, key)} disabled={loadingKey === key}>
                        <Icon name="sparkle" size={14} /> Explain simply
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => setOpen((prev) => ({ ...prev, [key]: !prev[key] }))}>
                        {open[key] ? 'Hide flashcards' : `Practice flashcards (${cards.length})`}
                      </button>
                      <Link className="btn btn-primary btn-sm" to={`/materials/${t.materialId}?tab=quiz`}>
                        Retake quiz
                      </Link>
                    </div>

                    {topicVideos.length > 0 && (
                      <p className="muted small">
                        Videos you watched for this topic:{' '}
                        {topicVideos.map((v, i) => (
                          <span key={v.id}>
                            {i > 0 && ', '}
                            <a href={youTubeWatchUrl(v.videoId)} target="_blank" rel="noreferrer">
                              {v.title}
                            </a>
                          </span>
                        ))}
                      </p>
                    )}

                    {loadingKey === key && <Loader message="Preparing a simple explanation…" />}

                    {explanation && (
                      <div className="explain-card">
                        <p>{explanation.explanation}</p>
                        {explanation.example && (
                          <p>
                            <strong>Example:</strong> {explanation.example}
                          </p>
                        )}
                        {explanation.remember && <p className="remember">💡 {explanation.remember}</p>}
                      </div>
                    )}

                    {open[key] &&
                      (cards.length > 0 ? (
                        <Flashcards cards={cards} onToggleKnown={(index, known) => setCardKnown(t.materialId, index, known)} />
                      ) : (
                        <p className="muted">No flashcards for this topic yet. Generate them from the material's Flashcards tab.</p>
                      ))}
                  </article>
                );
              })}
            </div>
          )}

          {strong.length > 0 && (
            <div className="card">
              <h3>Doing well</h3>
              <div className="chips">
                {strong.map((t) => (
                  <span key={`${t.materialId}-${t.topic}`} className="chip chip-success">
                    {t.topic} · {t.accuracy}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
