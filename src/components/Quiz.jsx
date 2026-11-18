import { useState } from 'react';
import { Link } from 'react-router-dom';
import { buildAttempt, toTopicList, WEAK_THRESHOLD } from '../utils/analytics.js';
import TopicBars from './TopicBars.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];

export default function Quiz({ material, onFinish, onRegenerate }) {
  const questions = material.quiz;
  const lastAttempt = material.attempts[material.attempts.length - 1];

  const [phase, setPhase] = useState('intro'); // intro -> running -> result
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attempt, setAttempt] = useState(null);

  const start = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setAttempt(null);
    setPhase('running');
  };

  const choose = (i) => {
    if (selected === null) setSelected(i);
  };

  const next = () => {
    const updated = [...answers, selected];
    if (index + 1 < questions.length) {
      setAnswers(updated);
      setIndex(index + 1);
      setSelected(null);
      return;
    }
    const result = buildAttempt(questions, updated);
    onFinish(result); // saves the attempt
    setAttempt(result);
    setPhase('result');
  };

  // ---------- intro ----------
  if (phase === 'intro') {
    const topics = [...new Set(questions.map((q) => q.topic))];
    return (
      <div className="card center-card">
        <h3>Ready for a quiz?</h3>
        <p className="muted">
          {questions.length} multiple-choice questions across {topics.length} topics. You will see the explanation after each answer.
        </p>
        <div className="chips">
          {topics.map((t) => (
            <span key={t} className="chip">
              {t}
            </span>
          ))}
        </div>
        {lastAttempt && (
          <p className="muted">
            Last score: <strong>{lastAttempt.percent}%</strong> ({lastAttempt.score}/{lastAttempt.total}) · {material.attempts.length} attempt
            {material.attempts.length > 1 ? 's' : ''}
          </p>
        )}
        <div className="row-gap">
          <button className="btn btn-primary" onClick={start}>
            {lastAttempt ? 'Retake quiz' : 'Start quiz'}
          </button>
          <button className="btn btn-ghost" onClick={onRegenerate}>
            Generate new questions
          </button>
        </div>
      </div>
    );
  }

  // ---------- result ----------
  if (phase === 'result') {
    const topicList = toTopicList(attempt.topics);
    const weak = topicList.filter((t) => t.accuracy < WEAK_THRESHOLD);
    const tone = attempt.percent >= 80 ? 'good' : attempt.percent >= WEAK_THRESHOLD ? 'ok' : 'low';
    const message =
      tone === 'good' ? 'Great work! You understand this material well.' : tone === 'ok' ? 'Good effort — a little revision will help.' : 'Keep going — focus on the weak topics below.';

    return (
      <div className="card">
        <div className="result-head">
          <div className={`score-ring ${tone}`}>
            <span>{attempt.percent}%</span>
          </div>
          <div>
            <h3>
              You scored {attempt.score} / {attempt.total}
            </h3>
            <p className="muted">{message}</p>
          </div>
        </div>

        <h4 className="section-title">Topic breakdown</h4>
        <TopicBars topics={topicList} />

        {weak.length > 0 ? (
          <div className="alert alert-warn">
            <span>
              <strong>Weak topics:</strong> {weak.map((t) => t.topic).join(', ')}
            </span>
            <Link to="/revise" className="alert-link">
              Go to revision
            </Link>
          </div>
        ) : (
          <div className="alert alert-success">No weak topics this time. Nice!</div>
        )}

        <h4 className="section-title">Review your answers</h4>
        <ul className="review-list">
          {questions.map((q, i) => {
            const right = answers[i] === q.answerIndex;
            return (
              <li key={i} className={right ? 'right' : 'wrong'}>
                <p>
                  <strong>
                    {i + 1}. {q.question}
                  </strong>
                </p>
                {!right && (
                  <p className="muted">
                    Your answer: {q.options[answers[i]]} · Correct: <strong>{q.options[q.answerIndex]}</strong>
                  </p>
                )}
                <p className="muted small">{q.explanation}</p>
              </li>
            );
          })}
        </ul>

        <div className="row-gap">
          <button className="btn btn-primary" onClick={start}>
            Retake quiz
          </button>
          <button className="btn btn-ghost" onClick={() => setPhase('intro')}>
            Back
          </button>
        </div>
      </div>
    );
  }

  // ---------- running ----------
  const q = questions[index];
  const answered = selected !== null;

  return (
    <div className="card">
      <div className="progress-row">
        <div className="bar">
          <div className="bar-fill" style={{ width: `${(index / questions.length) * 100}%` }} />
        </div>
        <span className="muted">
          {index + 1}/{questions.length}
        </span>
      </div>

      <span className="chip">{q.topic}</span>
      <h3 className="question">{q.question}</h3>

      <div className="options">
        {q.options.map((opt, i) => {
          let state = '';
          if (answered && i === q.answerIndex) state = 'correct';
          else if (answered && i === selected) state = 'incorrect';
          return (
            <button key={i} className={`option ${state}`} onClick={() => choose(i)} disabled={answered && state === '' }>
              <span className="option-letter">{LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`alert ${selected === q.answerIndex ? 'alert-success' : 'alert-error'}`}>
          <span>
            <strong>{selected === q.answerIndex ? 'Correct!' : 'Not quite.'}</strong> {q.explanation}
          </span>
        </div>
      )}

      <div className="row-end">
        <button className="btn btn-primary" onClick={next} disabled={!answered}>
          {index + 1 === questions.length ? 'Finish quiz' : 'Next question'}
        </button>
      </div>
    </div>
  );
}
