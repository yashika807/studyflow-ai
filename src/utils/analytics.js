// Pure functions that turn raw quiz attempts into weak-topic analysis and dashboard numbers.

export const WEAK_THRESHOLD = 60; // topic accuracy (%) below this counts as "weak"
const RECENT_ATTEMPTS = 3; // only the latest attempts per material decide weak topics

export function formatDate(timestamp) {
  return new Date(timestamp).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// 75 -> "1:15"
export function formatDuration(totalSeconds) {
  const s = Math.max(0, Math.round(totalSeconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// Builds the per-topic stats of a single quiz run.
// A missing answer (null, e.g. the timer ran out) counts as wrong.
export function buildAttempt(questions, answers, seconds = null) {
  const topics = {};
  let score = 0;

  questions.forEach((q, i) => {
    const correct = answers[i] === q.answerIndex;
    if (correct) score++;
    if (!topics[q.topic]) topics[q.topic] = { correct: 0, total: 0 };
    topics[q.topic].total++;
    if (correct) topics[q.topic].correct++;
  });

  return {
    id: crypto.randomUUID(),
    date: Date.now(),
    score,
    total: questions.length,
    percent: Math.round((score / questions.length) * 100),
    seconds,
    topics,
  };
}

export function toTopicList(topicMap) {
  return Object.entries(topicMap).map(([topic, s]) => ({
    topic,
    correct: s.correct,
    total: s.total,
    accuracy: Math.round((s.correct / s.total) * 100),
  }));
}

// Combines the latest attempts of every material into one list of topics, weakest first.
export function aggregateTopics(materials) {
  const rows = [];

  materials.forEach((material) => {
    const recent = material.attempts.slice(-RECENT_ATTEMPTS);
    const combined = {};
    recent.forEach((attempt) => {
      Object.entries(attempt.topics).forEach(([topic, s]) => {
        if (!combined[topic]) combined[topic] = { correct: 0, total: 0 };
        combined[topic].correct += s.correct;
        combined[topic].total += s.total;
      });
    });
    toTopicList(combined).forEach((t) => {
      rows.push({ ...t, materialId: material.id, materialTitle: material.title });
    });
  });

  return rows.sort((a, b) => a.accuracy - b.accuracy);
}

export function getWeakTopics(materials) {
  return aggregateTopics(materials).filter((t) => t.accuracy < WEAK_THRESHOLD);
}

export function getOverallStats(materials) {
  const attempts = materials.flatMap((m) => m.attempts);
  const cards = materials.flatMap((m) => m.flashcards || []);
  const avgScore = attempts.length
    ? Math.round(attempts.reduce((sum, a) => sum + a.percent, 0) / attempts.length)
    : null;

  return {
    materials: materials.length,
    quizzes: attempts.length,
    avgScore,
    cardsKnown: cards.filter((c) => c.known).length,
    cardsTotal: cards.length,
  };
}

export function getScoreTrend(materials) {
  return materials
    .flatMap((m) => m.attempts.map((a) => ({ ...a, title: m.title })))
    .sort((a, b) => a.date - b.date)
    .map((a, i) => ({ name: `#${i + 1}`, percent: a.percent, title: a.title, date: formatDate(a.date) }));
}

// Simple rule-based "what should I do next?" list for the dashboard.
export function getNextSteps(materials) {
  const steps = [];

  getWeakTopics(materials)
    .slice(0, 2)
    .forEach((t) =>
      steps.push({
        id: `weak-${t.materialId}-${t.topic}`,
        label: 'Revise',
        text: `Revise "${t.topic}" — you scored ${t.accuracy}%`,
        to: '/revise',
      }),
    );

  materials.forEach((m) => {
    if (!m.summary) {
      steps.push({ id: `sum-${m.id}`, label: 'Understand', text: `Generate a summary for "${m.title}"`, to: `/materials/${m.id}?tab=summary` });
    } else if (!m.quiz) {
      steps.push({ id: `gen-quiz-${m.id}`, label: 'Practice', text: `Create a quiz for "${m.title}"`, to: `/materials/${m.id}?tab=quiz` });
    } else if (m.attempts.length === 0) {
      steps.push({ id: `quiz-${m.id}`, label: 'Practice', text: `Take the quiz for "${m.title}"`, to: `/materials/${m.id}?tab=quiz` });
    }
  });

  return steps.slice(0, 4);
}
