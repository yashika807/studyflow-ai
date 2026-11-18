# StudyFlow AI

**Turn study material into an active learning workflow.**

`Study Material → Understand → Practice → Identify Weak Areas → Revise`

Most students read a PDF again and again without knowing what they actually understood. StudyFlow AI summarises the material, tests the student, finds the topics they are weak in, and tells them what to revise.

## Features

| Step | Feature |
| --- | --- |
| Input | Paste notes or upload a PDF (text is extracted in the browser with PDF.js) |
| Understand | AI summary, key points and topic list · "Explain this concept" in simple language |
| Practice | AI flashcards (flip, mark as known) · 8-question quiz with instant explanations |
| Weak areas | Score + topic-wise accuracy after every quiz (topics below 60% are "weak") |
| Revise | Revision page: weakest topics first, simple explanation, topic flashcards, retake quiz |
| Sources | **Videos** tab: save the YouTube links you learned from, tagged by topic, with notes. They also appear on the Revise page for weak topics |
| Progress | Dashboard with stats, score-trend chart, topic-accuracy chart and "what to do next" |
| Storage | Everything is saved in the browser (localStorage) – no backend |

## Tech stack

- **React 19** + JavaScript, HTML, CSS (plain CSS, no UI framework)
- **React Router** for the pages
- **Google Gemini API** for all AI features
- **PDF.js** (`pdfjs-dist`) for PDF text extraction
- **Recharts** for the dashboard charts
- **localStorage** for saving materials and progress
- **Vite** as the build tool

## Run it

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (usually http://localhost:5173).

### Gemini API key

1. Create a free key at <https://aistudio.google.com/apikey>.
2. Paste it in the app under **Settings** (stored only in your browser),
   or put `VITE_GEMINI_API_KEY=your_key` in a `.env` file (see `.env.example`).

No key? Click **Try sample material** – it ships with a ready-made summary, flashcards and quiz, so the whole flow (quiz → weak topics → revision → dashboard) works offline.

## Tests

```bash
npm test
```

Vitest unit tests (46) cover the parts with real logic:

- `src/utils/analytics.test.js` – quiz scoring, topic grouping, weak-topic threshold, "latest 3 attempts" rule, dashboard stats and next-step suggestions.
- `src/utils/youtube.test.js` – extracting the video id from watch / youtu.be / shorts / embed links and rejecting non-YouTube text.
- `src/services/gemini.test.js` – Gemini calls with a mocked `fetch`: API-key handling, error mapping, JSON/code-fence parsing, dropping malformed flashcards/questions and keeping the right answer after option shuffling.

## Project structure

```
src/
├── main.jsx, App.jsx          entry point and routes
├── context/StudyContext.jsx   global state (materials, attempts, API key) + localStorage sync
├── services/
│   ├── gemini.js              all Gemini prompts and response parsing
│   ├── pdf.js                 PDF text extraction
│   └── storage.js             localStorage helpers
├── utils/analytics.js         weak-topic logic, stats, "next steps" rules
├── data/sampleMaterial.js     demo material
├── components/                Layout, Flashcards, Quiz, ExplainTab, TopicBars, Icon, Feedback
└── pages/                     Dashboard, Materials, AddMaterial, MaterialView, Revise, Settings
```

## How the weak-topic analysis works

1. When the summary is generated, the AI also returns 4–6 **topics** of the material.
2. Every flashcard and quiz question is tagged with one of those topics.
3. After a quiz, answers are grouped by topic → `correct / total` per topic is stored in the attempt.
4. `aggregateTopics()` combines the latest 3 attempts of each material; topics under **60%** are weak and are listed (weakest first) on the Revise page and Dashboard.

## Data model (stored in localStorage)

```js
{
  id, title, text, createdAt,
  summary:    { overview, keyPoints[], topics[] },
  flashcards: [{ front, back, topic, known }],
  quiz:       [{ question, options[4], answerIndex, topic, explanation }],
  attempts:   [{ id, date, score, total, percent, topics: { [topic]: { correct, total } } }],
  videos:     [{ id, videoId, title, topic, notes, addedAt }]
}
```

## Possible future work

- Spaced-repetition schedule for flashcards
- Export / import progress as a file
- Support for images and scanned PDFs (OCR)
