import { afterEach, describe, expect, it, vi } from 'vitest';
import { AiError, chatWithTutor, explainConcept, generateFlashcards, generateQuiz, generateSummary } from './gemini.js';

// Builds a fake Gemini HTTP response whose text is the given payload.
function geminiResponse(payload, { fenced = false, status = 200 } = {}) {
  const text = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const body = { candidates: [{ content: { parts: [{ text: fenced ? '```json\n' + text + '\n```' : text }] } }] };
  return new Response(JSON.stringify(body), { status });
}

function mockFetch(response) {
  const fn = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fn);
  return fn;
}

afterEach(() => vi.unstubAllGlobals());

describe('API key handling', () => {
  it('refuses to call the API without a key', async () => {
    const fn = mockFetch(geminiResponse({}));
    await expect(generateSummary('notes', '')).rejects.toMatchObject({ code: 'NO_API_KEY' });
    expect(fn).not.toHaveBeenCalled();
  });

  it('sends the key as a header and asks for JSON', async () => {
    const fn = mockFetch(geminiResponse({ overview: 'o', keyPoints: ['k'], topics: ['t'] }));
    await generateSummary('notes', 'my-key');
    const [url, options] = fn.mock.calls[0];
    expect(url).not.toContain('my-key'); // key must not leak into the URL
    expect(options.headers['x-goog-api-key']).toBe('my-key');
    expect(JSON.parse(options.body).generationConfig.responseMimeType).toBe('application/json');
  });
});

describe('error handling', () => {
  it('maps a rejected key to BAD_KEY', async () => {
    mockFetch(new Response(JSON.stringify({ error: { message: 'API key not valid' } }), { status: 400 }));
    await expect(generateSummary('notes', 'bad')).rejects.toMatchObject({ code: 'BAD_KEY' });
  });

  it('maps HTTP 429 to RATE_LIMIT', async () => {
    mockFetch(new Response('{}', { status: 429 }));
    await expect(generateSummary('notes', 'k')).rejects.toMatchObject({ code: 'RATE_LIMIT' });
  });

  it('maps a network failure to NETWORK', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    await expect(generateSummary('notes', 'k')).rejects.toMatchObject({ code: 'NETWORK' });
  });

  it('reports unreadable JSON as BAD_JSON', async () => {
    mockFetch(geminiResponse('this is not json'));
    await expect(generateSummary('notes', 'k')).rejects.toBeInstanceOf(AiError);
  });

  it('rejects an incomplete summary', async () => {
    mockFetch(geminiResponse({ overview: 'only this' }));
    await expect(generateSummary('notes', 'k')).rejects.toMatchObject({ code: 'BAD_JSON' });
  });
});

describe('generateSummary', () => {
  it('parses JSON wrapped in markdown code fences', async () => {
    mockFetch(geminiResponse({ overview: 'o', keyPoints: ['a', 'b'], topics: ['T1', 'T2'] }, { fenced: true }));
    expect(await generateSummary('notes', 'k')).toEqual({ overview: 'o', keyPoints: ['a', 'b'], topics: ['T1', 'T2'] });
  });

  it('truncates very long material before sending it', async () => {
    const fn = mockFetch(geminiResponse({ overview: 'o', keyPoints: [], topics: [] }));
    await generateSummary('x'.repeat(50000), 'k');
    const prompt = JSON.parse(fn.mock.calls[0][1].body).contents[0].parts[0].text;
    expect(prompt.length).toBeLessThan(26000);
  });
});

describe('generateFlashcards', () => {
  it('drops incomplete cards, defaults unknown topics and starts as not known', async () => {
    mockFetch(
      geminiResponse({
        flashcards: [
          { front: 'Q1', back: 'A1', topic: 'T2' },
          { front: 'Q2', back: 'A2', topic: 'Made up' },
          { front: 'no answer' },
        ],
      }),
    );
    const cards = await generateFlashcards('notes', ['T1', 'T2'], 'k');
    expect(cards).toEqual([
      { front: 'Q1', back: 'A1', topic: 'T2', known: false },
      { front: 'Q2', back: 'A2', topic: 'T1', known: false },
    ]);
  });

  it('throws when no usable card is returned', async () => {
    mockFetch(geminiResponse({ flashcards: [] }));
    await expect(generateFlashcards('notes', ['T1'], 'k')).rejects.toMatchObject({ code: 'BAD_JSON' });
  });
});

describe('generateQuiz', () => {
  const good = { question: 'Q?', options: ['a', 'b', 'c', 'd'], answerIndex: 2, topic: 'T1', explanation: 'because' };

  it('keeps the correct answer pointing at the right option after shuffling', async () => {
    mockFetch(geminiResponse({ questions: Array.from({ length: 20 }, () => good) }));
    const quiz = await generateQuiz('notes', ['T1'], 'k');
    expect(quiz).toHaveLength(20);
    quiz.forEach((q) => {
      expect(q.options).toHaveLength(4);
      expect(q.options[q.answerIndex]).toBe('c');
    });
  });

  it('filters out malformed questions', async () => {
    mockFetch(
      geminiResponse({
        questions: [
          good,
          { ...good, options: ['only', 'two'] },
          { ...good, answerIndex: 7 },
          { ...good, answerIndex: 'x' },
          { options: ['a', 'b', 'c', 'd'], answerIndex: 0 },
        ],
      }),
    );
    expect(await generateQuiz('notes', ['T1'], 'k')).toHaveLength(1);
  });

  it('falls back to the first topic when the topic is unknown', async () => {
    mockFetch(geminiResponse({ questions: [{ ...good, topic: 'Nope' }] }));
    const [q] = await generateQuiz('notes', ['First', 'Second'], 'k');
    expect(q.topic).toBe('First');
  });
});

describe('explainConcept', () => {
  it('returns the concept together with the explanation', async () => {
    mockFetch(geminiResponse({ explanation: 'simple', example: 'like X', remember: 'short' }));
    expect(await explainConcept('notes', 'deadlock', 'k')).toEqual({
      concept: 'deadlock',
      explanation: 'simple',
      example: 'like X',
      remember: 'short',
    });
  });

  it('rejects an answer without an explanation', async () => {
    mockFetch(geminiResponse({ example: 'only example' }));
    await expect(explainConcept('notes', 'x', 'k')).rejects.toBeInstanceOf(AiError);
  });
});

describe('chatWithTutor', () => {
  it('sends the conversation with model/user roles and returns trimmed text', async () => {
    const fn = mockFetch(geminiResponse('  Sure! Here you go.  '));
    const reply = await chatWithTutor(
      [
        { role: 'user', text: 'Hi' },
        { role: 'assistant', text: 'Hello!' },
        { role: 'user', text: 'Explain RR scheduling' },
      ],
      'k',
    );
    expect(reply).toBe('Sure! Here you go.');

    const body = JSON.parse(fn.mock.calls[0][1].body);
    expect(body.contents.map((c) => c.role)).toEqual(['user', 'model', 'user']);
    expect(body.contents[2].parts[0].text).toBe('Explain RR scheduling');
    expect(body.generationConfig.responseMimeType).toBeUndefined(); // plain text, not JSON
  });

  it('adds the chosen material to the instructions', async () => {
    const fn = mockFetch(geminiResponse('ok'));
    await chatWithTutor([{ role: 'user', text: 'Summarise' }], 'k', { title: 'CPU Scheduling', text: 'Round Robin uses a time quantum.' });
    const body = JSON.parse(fn.mock.calls[0][1].body);
    expect(body.systemInstruction.parts[0].text).toContain('CPU Scheduling');
    expect(body.systemInstruction.parts[0].text).toContain('time quantum');
  });

  it('only sends the most recent messages', async () => {
    const fn = mockFetch(geminiResponse('ok'));
    const long = Array.from({ length: 30 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', text: `m${i}` }));
    await chatWithTutor([...long, { role: 'user', text: 'last' }], 'k');
    expect(JSON.parse(fn.mock.calls[0][1].body).contents).toHaveLength(12);
  });

  it('needs an API key', async () => {
    await expect(chatWithTutor([{ role: 'user', text: 'hi' }], '')).rejects.toMatchObject({ code: 'NO_API_KEY' });
  });
});
