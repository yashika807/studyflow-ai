import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { buildAttempt, formatDuration, toTopicList, WEAK_THRESHOLD } from '../utils/analytics.js';
import Icon from './Icon.jsx';
import TopicBars from './TopicBars.jsx';
import ScoreRing from './ScoreRing.jsx';

const LETTERS = ['A', 'B', 'C', 'D'];
const SECONDS_PER_QUESTION = 30;
const TIMED_OUT = -1; // value of `selected` when the countdown reaches zero

export default function Quiz({ material, onFinish, onRegenerate }) {
  const questions = material.quiz;
  const lastAttempt = material.attempts[material.attempts.length - 1];

  const [phase, setPhase] = useState('intro'); // intro -> running -> result
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [attempt, setAttempt] = useState(null);

  const [timed, setTimed] = useState(true); // timed mode switch on the intro screen
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION);
  const startedAt = useRef(0);

  const answered = selected !== null;

  // Countdown: ticks once per second while a question is open, and locks it at 0.
  useEffect(() => {
    if (phase !== 'running' || !timed || answered) return;
    if (timeLeft <= 0) {
      setSelected(TIMED_OUT);
      return;
    }
    const id = setTimeout(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearTimeout(id);
  }, [phase, timed, answered, timeLeft]);

  const start = () => {
    setIndex(0);
    setSelected(null);
    setAnswers([]);
    setAttempt(null);
    setTimeLeft(SECONDS_PER_QUESTION);
    startedAt.current = Date.now();
    setPhase('running');
  };

  const choose = (i) => {
    if (selected === null) setSelected(i);
  };

  const next = () => {
    const updated = [...answers, selected === TIMED_OUT ? null : selected];
    if (index + 1 < questions.length) {
      setAnswers(updated);
      setIndex(index + 1);
      setSelected(null);
      setTimeLeft(SECONDS_PER_QUESTION);
      return;
    }
    const seconds = Math.round((Date.now() - startedAt.current) / 1000);
    const result = buildAttempt(questions, updated, seconds);
    setAnswers(updated);
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

        <label className="toggle">
          <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} />
          <span>
            <strong>Timed mode</strong> · {SECONDS_PER_QUESTION} seconds per question
          </span>
        </label>

        {lastAttempt && (
          <p className="muted">
            Last score: <strong>{lastAttempt.percent}%</strong> ({lastAttempt.score}/{lastAttempt.total})
            {lastAttempt.seconds != null && <> in {formatDuration(lastAttempt.seconds)}</>} · {material.attempts.length} attempt
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
    const unanswered = answers.filter((a) => a === null).length;

    return (
      <div className="card">
        <div className="result-head">
          <ScoreRing percent={attempt.percent} tone={tone} />
          <div>
            <h3>
              You scored {attempt.score} / {attempt.total}
            </h3>
            <p className="muted">{message}</p>
            <p className="muted small result-meta">
              <Icon name="clock" size={14} /> Time taken: {formatDuration(attempt.seconds)}
              {unanswered > 0 && ` · ${unanswered} unanswered (time ran out)`}
            </p>
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
                    Your answer: {answers[i] === null ? <em>not answered (time ran out)</em> : q.options[answers[i]]} · Correct:{' '}
                    <strong>{q.options[q.answerIndex]}</strong>
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
  const timedOut = selected === TIMED_OUT;
  const timerTone = timeLeft <= 5 ? 'danger' : timeLeft <= 10 ? 'warn' : '';

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

      <div className="quiz-top">
        <span className="chip">{q.topic}</span>
        {timed && (
          <span className={`timer ${timerTone}`} role="timer" aria-label={`${timeLeft} seconds left`}>
            <Icon name="clock" size={15} /> {formatDuration(timeLeft)}
          </span>
        )}
      </div>
      {timed && (
        <div className={`timer-bar ${timerTone}`}>
          <div style={{ width: `${(timeLeft / SECONDS_PER_QUESTION) * 100}%` }} />
        </div>
      )}

      <h3 className="question">{q.question}</h3>

      <div className="options">
        {q.options.map((opt, i) => {
          let state = '';
          if (answered && i === q.answerIndex) state = 'correct';
          else if (answered && i === selected) state = 'incorrect';
          return (
            <button key={i} className={`option ${state}`} onClick={() => choose(i)} disabled={answered && state === ''}>
              <span className="option-letter">{LETTERS[i]}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>

      {answered && (
        <div className={`alert ${selected === q.answerIndex ? 'alert-success' : 'alert-error'}`}>
          <span>
            <strong>{selected === q.answerIndex ? 'Correct!' : timedOut ? "Time's up!" : 'Not quite.'}</strong> {q.explanation}
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
