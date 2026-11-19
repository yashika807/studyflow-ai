# StudyFlow AI

**Turn study material into an active learning workflow.**

`Study Material → Understand → Practice → Identify Weak Areas → Revise`

Most students read a PDF again and again without knowing what they actually understood. StudyFlow AI summarises the material, tests the student, finds the topics they are weak in, and tells them what to revise.

## Features

| Step | Feature |
| --- | --- |
| Account | **Login / sign-up page** is the first screen. Every account has its own materials, quizzes and calendar. Passwords are salted + hashed (PBKDF2), never stored as plain text |
| Input | Paste notes or upload a PDF (text is extracted in the browser with PDF.js) |
| Understand | AI summary, key points and topic list · "Explain this concept" in simple language |
| Practice | AI flashcards (flip, mark as known) · 8-question quiz with instant explanations and an optional **timed mode** (30 s per question, total time shown in the result) |
| Weak areas | Score + topic-wise accuracy after every quiz (topics below 60% are "weak") |
| Revise | Revision page: weakest topics first, simple explanation, topic flashcards, retake quiz |
| Sources | **Videos** tab: save the YouTube links you learned from, tagged by topic, with notes. They also appear on the Revise page for weak topics |
| Calendar | **Exam calendar**: add your exams and events with a date (and optional time) on a month calendar, with a countdown to each one. The next three upcoming exams also show on the dashboard |
| Chatbot | **Study assistant** on the dashboard: ask anything, optionally using one of your materials as context |
| Progress | Dashboard with stats, score-trend chart, topic-accuracy chart and "what to do next" |
| UI | Two themes with a toggle (remembers your choice): **Trust & Calm** (light: blues, teals, greens) and **Bold & Modern** (dark: charcoal/black surfaces with vibrant cyan and mint accents). All colours are CSS variables in `src/index.css`. Responsive layout with a bottom tab bar on phones, animated score ring and charts that follow the theme |
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

No key? Click **Try sample material** – it ships with a ready-made summary, flashcards and quiz, so the whole flow (quiz → weak topics → revision → dashboard) works offline. Only the chatbot and the AI generation (summary, flashcards, quiz, explain) need the key; the calendar works without it.

### Login

There is no server, so accounts live in your browser's localStorage. This keeps different people's data separate on one computer, but it is a project-level login, not production-grade authentication. Materials saved before login existed are given to the first account that signs up.

## Tests

```bash
npm test
```

Vitest unit tests (70) cover the parts with real logic:

- `src/services/auth.test.js` – sign-up validation, duplicate emails, hashed + salted passwords, login errors, sessions, handing old data to the first account.
- `src/utils/calendar.test.js` – month grid, days-until countdown, time formatting, sorting.
- `src/utils/analytics.test.js` – quiz scoring, topic grouping, weak-topic threshold, "latest 3 attempts" rule, dashboard stats and next-step suggestions.
- `src/utils/youtube.test.js` – extracting the video id from watch / youtu.be / shorts / embed links and rejecting non-YouTube text.
- `src/services/gemini.test.js` – Gemini calls with a mocked `fetch`: API-key handling, error mapping, JSON/code-fence parsing, dropping malformed flashcards/questions and keeping the right answer after option shuffling.

## Project structure

```
src/
├── main.jsx, App.jsx          entry point, routes, login gate
├── context/
│   ├── AuthContext.jsx        logged-in user
│   └── StudyContext.jsx       per-user state (materials, calendar events, API key) + localStorage sync
├── services/
│   ├── auth.js                sign up / log in with hashed passwords
│   ├── gemini.js              all Gemini prompts (summary, flashcards, quiz, explain, chat) and parsing
│   ├── pdf.js                 PDF text extraction
│   └── storage.js             per-user localStorage helpers
├── utils/
│   ├── analytics.js           weak-topic logic, stats, "next steps" rules
│   ├── calendar.js            month grid and date helpers
│   └── youtube.js             YouTube link parser
├── data/sampleMaterial.js     demo material
├── components/                Layout, ChatBot, UpcomingExams, Flashcards, Quiz, ExplainTab, VideosTab …
└── pages/                     Login, Dashboard, Materials, AddMaterial, MaterialView, Calendar, Revise, Settings
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
// calendar event: { id, title, date: 'YYYY-MM-DD', time: 'HH:MM' | '', source: 'manual' }
// materials and events are stored per user: studyflow.materials.v1.<userId>, studyflow.events.v1.<userId>
```

## Possible future work

- Spaced-repetition schedule for flashcards
- Export / import progress as a file
- Support for images and scanned PDFs (OCR)
