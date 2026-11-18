// Thin wrapper around the Gemini REST API.
// Every feature (summary, flashcards, quiz, explain) asks the model for JSON.

const MODEL = 'gemini-2.5-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;
const MAX_CHARS = 24000; // keep prompts small so requests stay fast and cheap

export class AiError extends Error {
  constructor(message, code = 'AI_ERROR') {
    super(message);
    this.code = code;
  }
}

function trimMaterial(text) {
  return text.length > MAX_CHARS ? text.slice(0, MAX_CHARS) : text;
}

function parseJson(raw) {
  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    throw new AiError('The AI sent back an unreadable answer. Please try again.', 'BAD_JSON');
  }
}

async function generateJson(prompt, apiKey) {
  if (!apiKey) {
    throw new AiError('Add your Gemini API key in Settings to use AI features.', 'NO_API_KEY');
  }

  let res;
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.4 },
      }),
    });
  } catch {
    throw new AiError('Network error. Check your internet connection and try again.', 'NETWORK');
  }

  if (!res.ok) {
    let detail = '';
    try {
      detail = (await res.json()).error?.message || '';
    } catch {
      /* ignore */
    }
    if (res.status === 400 && /api key/i.test(detail)) {
      throw new AiError('Your Gemini API key is not valid. Please check it in Settings.', 'BAD_KEY');
    }
    if (res.status === 401 || res.status === 403) {
      throw new AiError('Your Gemini API key was rejected. Please check it in Settings.', 'BAD_KEY');
    }
    if (res.status === 429) {
      throw new AiError('Too many requests or free quota used up. Wait a minute and try again.', 'RATE_LIMIT');
    }
    throw new AiError(detail || `The AI service returned an error (${res.status}).`);
  }

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text || '').join('');
  if (!text) throw new AiError('The AI returned an empty answer. Please try again.');
  return parseJson(text);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

// ---------- 1. Summary + topic list ----------
export async function generateSummary(text, apiKey) {
  const prompt = `You are a study assistant. Read the study material and return JSON with exactly this shape:
{
  "overview": "2-3 sentence summary in simple language",
  "keyPoints": ["5 to 8 short bullet points covering the most important ideas"],
  "topics": ["4 to 6 short topic names (1-4 words each) that the material is made of"]
}

STUDY MATERIAL:
"""
${trimMaterial(text)}
"""`;

  const data = await generateJson(prompt, apiKey);
  if (!data.overview || !Array.isArray(data.keyPoints) || !Array.isArray(data.topics)) {
    throw new AiError('The AI answer was incomplete. Please try again.', 'BAD_JSON');
  }
  return { overview: data.overview, keyPoints: data.keyPoints, topics: data.topics };
}

// ---------- 2. Flashcards ----------
export async function generateFlashcards(text, topics, apiKey) {
  const prompt = `Create 10 flashcards from the study material below. Return JSON:
{ "flashcards": [ { "front": "question or term", "back": "short clear answer", "topic": "one of the allowed topics" } ] }

Rules:
- "topic" MUST be exactly one of: ${JSON.stringify(topics)}
- Keep "back" under 30 words.
- Cover every topic.

STUDY MATERIAL:
"""
${trimMaterial(text)}
"""`;

  const data = await generateJson(prompt, apiKey);
  const cards = (data.flashcards || [])
    .filter((c) => c.front && c.back)
    .map((c) => ({
      front: c.front,
      back: c.back,
      topic: topics.includes(c.topic) ? c.topic : topics[0],
      known: false,
    }));
  if (cards.length === 0) throw new AiError('No flashcards were created. Please try again.', 'BAD_JSON');
  return cards;
}

// ---------- 3. Quiz ----------
export async function generateQuiz(text, topics, apiKey) {
  const prompt = `Create 8 multiple-choice questions from the study material below. Return JSON:
{ "questions": [ { "question": "...", "options": ["A","B","C","D"], "answerIndex": 0, "topic": "one of the allowed topics", "explanation": "one sentence on why the answer is correct" } ] }

Rules:
- Exactly 4 options per question, only one correct. "answerIndex" is the 0-based index of the correct option.
- "topic" MUST be exactly one of: ${JSON.stringify(topics)}
- Spread the questions across all topics.
- Test understanding, not just memory.

STUDY MATERIAL:
"""
${trimMaterial(text)}
"""`;

  const data = await generateJson(prompt, apiKey);
  const questions = (data.questions || [])
    .filter((q) => q.question && Array.isArray(q.options) && q.options.length === 4 && Number.isInteger(q.answerIndex))
    .filter((q) => q.answerIndex >= 0 && q.answerIndex < 4)
    .map((q) => {
      // shuffle options so the right answer is not always in the same place
      const correct = q.options[q.answerIndex];
      const options = shuffle(q.options);
      return {
        question: q.question,
        options,
        answerIndex: options.indexOf(correct),
        topic: topics.includes(q.topic) ? q.topic : topics[0],
        explanation: q.explanation || '',
      };
    });
  if (questions.length === 0) throw new AiError('No quiz questions were created. Please try again.', 'BAD_JSON');
  return questions;
}

// ---------- 4. Explain a concept ----------
export async function explainConcept(text, concept, apiKey) {
  const prompt = `Explain the concept "${concept}" to a first-year college student in very simple language.
Use the study material for context. Return JSON:
{
  "explanation": "3-5 simple sentences, no jargon",
  "example": "one everyday example or analogy",
  "remember": "one-line takeaway to remember"
}

STUDY MATERIAL:
"""
${trimMaterial(text)}
"""`;

  const data = await generateJson(prompt, apiKey);
  if (!data.explanation) throw new AiError('The AI answer was incomplete. Please try again.', 'BAD_JSON');
  return { concept, explanation: data.explanation, example: data.example || '', remember: data.remember || '' };
}
