import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import Flashcards from '../components/Flashcards.jsx';
import Quiz from '../components/Quiz.jsx';
import ExplainTab from '../components/ExplainTab.jsx';
import VideosTab from '../components/VideosTab.jsx';
import Icon from '../components/Icon.jsx';
import { EmptyState, ErrorBox, GenerateCard, Loader } from '../components/Feedback.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { generateFlashcards, generateQuiz, generateSummary } from '../services/gemini.js';
import { formatDate, wordCount } from '../utils/analytics.js';

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'flashcards', label: 'Flashcards' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'explain', label: 'Explain' },
  { id: 'videos', label: 'Videos' },
];

const LOADING_TEXT = {
  summary: 'Reading your material and writing a summary…',
  flashcards: 'Creating flashcards…',
  quiz: 'Writing quiz questions…',
};

export default function MaterialView() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const { materials, apiKey, updateMaterial, addAttempt, setCardKnown } = useStudy();
  const material = materials.find((m) => m.id === id);

  const [busy, setBusy] = useState(null); // which part is being generated
  const [failed, setFailed] = useState(null); // { kind, error }

  if (!material) {
    return (
      <div className="page">
        <div className="card">
          <EmptyState icon="file" title="Material not found" text="It may have been deleted.">
            <Link to="/materials" className="btn btn-primary">
              Back to materials
            </Link>
          </EmptyState>
        </div>
      </div>
    );
  }

  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab') : 'summary';

  // Flashcards and quizzes need the topic list, so the summary is created first if missing.
  const generate = async (kind) => {
    setBusy(kind);
    setFailed(null);
    try {
      let summary = material.summary;
      if (!summary) {
        summary = await generateSummary(material.text, apiKey);
        updateMaterial(id, { summary });
      }
      if (kind === 'flashcards') {
        updateMaterial(id, { flashcards: await generateFlashcards(material.text, summary.topics, apiKey) });
      } else if (kind === 'quiz') {
        updateMaterial(id, { quiz: await generateQuiz(material.text, summary.topics, apiKey) });
      }
    } catch (error) {
      setFailed({ kind, error });
    } finally {
      setBusy(null);
    }
  };

  const errorFor = (kind) => (failed?.kind === kind ? failed.error : null);

  return (
    <div className="page">
      <Link to="/materials" className="back-link">
        ← All materials
      </Link>
      <header className="page-head">
        <div>
          <h1>{material.title}</h1>
          <p className="muted">
            {wordCount(material.text).toLocaleString()} words · added {formatDate(material.createdAt)}
          </p>
        </div>
      </header>

      <div className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? ' active' : ''}`} onClick={() => setParams({ tab: t.id })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'summary' &&
        (material.summary ? (
          <div className="card">
            <h3>Overview</h3>
            <p>{material.summary.overview}</p>

            <h3>Key points</h3>
            <ul className="bullets">
              {material.summary.keyPoints.map((point, i) => (
                <li key={i}>{point}</li>
              ))}
            </ul>

            <h3>Topics covered</h3>
            <div className="chips">
              {material.summary.topics.map((topic) => (
                <span key={topic} className="chip chip-primary">
                  {topic}
                </span>
              ))}
            </div>
            <p className="muted small">These topics are used to find your weak areas after each quiz.</p>
          </div>
        ) : (
          <GenerateCard
            title="Understand the material"
            text="Get a short summary, the key points and the main topics."
            buttonLabel="Generate summary"
            onGenerate={() => generate('summary')}
            loading={busy === 'summary'}
            loadingMessage={LOADING_TEXT.summary}
            error={errorFor('summary')}
          />
        ))}

      {tab === 'flashcards' &&
        (busy === 'flashcards' ? (
          <div className="card">
            <Loader message={LOADING_TEXT.flashcards} />
          </div>
        ) : material.flashcards ? (
          <div className="card">
            <Flashcards cards={material.flashcards.map((c, i) => ({ ...c, index: i }))} onToggleKnown={(index, known) => setCardKnown(id, index, known)} />
            <div className="row-end">
              <button className="btn btn-ghost btn-sm" onClick={() => generate('flashcards')}>
                <Icon name="refresh" size={14} /> Generate new set
              </button>
            </div>
            <ErrorBox error={errorFor('flashcards')} />
          </div>
        ) : (
          <GenerateCard
            title="Practice with flashcards"
            text="Create a deck of flashcards from this material and mark the ones you already know."
            buttonLabel="Generate flashcards"
            onGenerate={() => generate('flashcards')}
            loading={false}
            error={errorFor('flashcards')}
          />
        ))}

      {tab === 'quiz' &&
        (busy === 'quiz' ? (
          <div className="card">
            <Loader message={LOADING_TEXT.quiz} />
          </div>
        ) : material.quiz ? (
          <>
            <ErrorBox error={errorFor('quiz')} />
            <Quiz key={material.quiz[0].question} material={material} onFinish={(attempt) => addAttempt(id, attempt)} onRegenerate={() => generate('quiz')} />
          </>
        ) : (
          <GenerateCard
            title="Test yourself"
            text="Take an 8-question quiz. You will get a score and a topic-wise analysis of what to revise."
            buttonLabel="Generate quiz"
            onGenerate={() => generate('quiz')}
            loading={false}
            error={errorFor('quiz')}
          />
        ))}

      {tab === 'explain' && <ExplainTab material={material} />}

      {tab === 'videos' && <VideosTab material={material} />}
    </div>
  );
}
