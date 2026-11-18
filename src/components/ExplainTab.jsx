import { useState } from 'react';
import { ErrorBox, Loader } from './Feedback.jsx';
import Icon from './Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { explainConcept } from '../services/gemini.js';

export default function ExplainTab({ material }) {
  const { apiKey } = useStudy();
  const [concept, setConcept] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([]); // newest first

  const topics = material.summary?.topics || [];

  const ask = async (e) => {
    e?.preventDefault();
    const question = concept.trim();
    if (!question) return;
    setLoading(true);
    setError(null);
    try {
      const result = await explainConcept(material.text, question, apiKey);
      setAnswers((prev) => [result, ...prev]);
      setConcept('');
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3>Explain this concept</h3>
      <p className="muted">Stuck on something? Type a concept from your material and get a simple explanation.</p>

      <form className="ask-row" onSubmit={ask}>
        <input type="text" value={concept} onChange={(e) => setConcept(e.target.value)} placeholder="e.g. convoy effect" maxLength={120} />
        <button className="btn btn-primary" type="submit" disabled={loading || !concept.trim()}>
          <Icon name="sparkle" size={16} /> Explain
        </button>
      </form>

      {topics.length > 0 && (
        <div className="chips">
          <span className="muted small">Try:</span>
          {topics.map((t) => (
            <button key={t} type="button" className="chip chip-button" onClick={() => setConcept(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      {loading && <Loader message="Thinking of a simple explanation…" />}
      <ErrorBox error={error} />

      {answers.map((a, i) => (
        <article key={i} className="explain-card">
          <h4>{a.concept}</h4>
          <p>{a.explanation}</p>
          {a.example && (
            <p>
              <strong>Example:</strong> {a.example}
            </p>
          )}
          {a.remember && <p className="remember">💡 {a.remember}</p>}
        </article>
      ))}
    </div>
  );
}
