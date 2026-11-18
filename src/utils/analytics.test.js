import { describe, expect, it } from 'vitest';
import { aggregateTopics, buildAttempt, getNextSteps, getOverallStats, getScoreTrend, getWeakTopics, toTopicList, WEAK_THRESHOLD } from './analytics.js';

const questions = [
  { question: 'q1', options: ['a', 'b', 'c', 'd'], answerIndex: 0, topic: 'Alpha' },
  { question: 'q2', options: ['a', 'b', 'c', 'd'], answerIndex: 1, topic: 'Alpha' },
  { question: 'q3', options: ['a', 'b', 'c', 'd'], answerIndex: 2, topic: 'Beta' },
  { question: 'q4', options: ['a', 'b', 'c', 'd'], answerIndex: 3, topic: 'Beta' },
];

// helper: a material with the given attempts (each attempt = { topic: [correct, total] })
function makeMaterial(id, attempts = [], extra = {}) {
  return {
    id,
    title: `Material ${id}`,
    text: 'text',
    summary: { overview: '', keyPoints: [], topics: [] },
    flashcards: null,
    quiz: [{}],
    attempts: attempts.map((topics, i) => {
      const parsed = Object.fromEntries(Object.entries(topics).map(([t, [correct, total]]) => [t, { correct, total }]));
      const all = Object.values(parsed);
      const score = all.reduce((s, t) => s + t.correct, 0);
      const total = all.reduce((s, t) => s + t.total, 0);
      return { id: `${id}-${i}`, date: 1000 + i, score, total, percent: Math.round((score / total) * 100), topics: parsed };
    }),
    ...extra,
  };
}

describe('buildAttempt', () => {
  it('scores answers and groups results by topic', () => {
    // Alpha: q1 right, q2 wrong. Beta: q3 right, q4 right.
    const attempt = buildAttempt(questions, [0, 0, 2, 3]);
    expect(attempt.score).toBe(3);
    expect(attempt.total).toBe(4);
    expect(attempt.percent).toBe(75);
    expect(attempt.topics).toEqual({
      Alpha: { correct: 1, total: 2 },
      Beta: { correct: 2, total: 2 },
    });
  });

  it('handles a perfect and a zero score', () => {
    expect(buildAttempt(questions, [0, 1, 2, 3]).percent).toBe(100);
    expect(buildAttempt(questions, [3, 3, 3, 0]).percent).toBe(0);
  });
});

describe('toTopicList', () => {
  it('converts the topic map to rounded percentages', () => {
    expect(toTopicList({ A: { correct: 1, total: 3 } })).toEqual([{ topic: 'A', correct: 1, total: 3, accuracy: 33 }]);
  });
});

describe('aggregateTopics / getWeakTopics', () => {
  it('sorts topics weakest first', () => {
    const m = makeMaterial('m1', [{ Easy: [4, 4], Hard: [1, 4], Mid: [2, 4] }]);
    expect(aggregateTopics([m]).map((t) => t.topic)).toEqual(['Hard', 'Mid', 'Easy']);
  });

  it('flags only topics below the weak threshold', () => {
    const m = makeMaterial('m1', [{ Weak: [1, 4], Borderline: [3, 5], Strong: [4, 4] }]); // 25%, 60%, 100%
    const weak = getWeakTopics([m]);
    expect(weak.map((t) => t.topic)).toEqual(['Weak']);
    expect(weak.every((t) => t.accuracy < WEAK_THRESHOLD)).toBe(true);
  });

  it('only uses the latest 3 attempts so improvement is recognised', () => {
    const m = makeMaterial('m1', [
      { T: [0, 2] }, // old, bad attempts are ignored once 3 newer ones exist
      { T: [2, 2] },
      { T: [2, 2] },
      { T: [2, 2] },
    ]);
    const [row] = aggregateTopics([m]);
    expect(row.accuracy).toBe(100);
    expect(getWeakTopics([m])).toHaveLength(0);
  });

  it('combines attempts and keeps materials separate', () => {
    const a = makeMaterial('a', [{ T: [1, 2] }, { T: [0, 2] }]); // 1/4 = 25%
    const b = makeMaterial('b', [{ T: [2, 2] }]); // 100%
    const rows = aggregateTopics([a, b]);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ materialId: 'a', accuracy: 25, correct: 1, total: 4 });
    expect(rows[1]).toMatchObject({ materialId: 'b', accuracy: 100 });
  });

  it('returns nothing when there are no attempts', () => {
    expect(aggregateTopics([makeMaterial('m1')])).toEqual([]);
  });
});

describe('getOverallStats', () => {
  it('handles an empty library', () => {
    expect(getOverallStats([])).toEqual({ materials: 0, quizzes: 0, avgScore: null, cardsKnown: 0, cardsTotal: 0 });
  });

  it('averages scores and counts known flashcards', () => {
    const m = makeMaterial('m1', [{ T: [1, 2] }, { T: [2, 2] }], {
      flashcards: [{ known: true }, { known: false }, { known: true }],
    });
    expect(getOverallStats([m])).toEqual({ materials: 1, quizzes: 2, avgScore: 75, cardsKnown: 2, cardsTotal: 3 });
  });
});

describe('getScoreTrend', () => {
  it('orders attempts by date across materials', () => {
    const a = makeMaterial('a', [{ T: [1, 2] }]); // date 1000
    const b = makeMaterial('b', [{ T: [2, 2] }, { T: [0, 2] }]); // dates 1000, 1001
    const trend = getScoreTrend([a, b]);
    expect(trend.map((p) => p.name)).toEqual(['#1', '#2', '#3']);
    expect(trend.map((p) => p.percent)).toEqual([50, 100, 0]);
  });
});

describe('getNextSteps', () => {
  it('suggests revising weak topics first', () => {
    const m = makeMaterial('m1', [{ Hard: [0, 4] }]);
    const steps = getNextSteps([m]);
    expect(steps[0]).toMatchObject({ label: 'Revise', to: '/revise' });
  });

  it('guides a fresh material through summary, quiz creation and first attempt', () => {
    const fresh = makeMaterial('m1', [], { summary: null, quiz: null });
    expect(getNextSteps([fresh])[0].to).toBe('/materials/m1?tab=summary');

    const noQuiz = makeMaterial('m2', [], { quiz: null });
    expect(getNextSteps([noQuiz])[0].text).toMatch(/Create a quiz/);

    const untaken = makeMaterial('m3', []);
    expect(getNextSteps([untaken])[0].text).toMatch(/Take the quiz/);
  });

  it('returns no steps when everything is done and nothing is weak', () => {
    expect(getNextSteps([makeMaterial('m1', [{ T: [4, 4] }])])).toEqual([]);
  });

  it('never returns more than 4 steps', () => {
    const many = Array.from({ length: 10 }, (_, i) => makeMaterial(`m${i}`, [], { summary: null }));
    expect(getNextSteps(many)).toHaveLength(4);
  });
});
