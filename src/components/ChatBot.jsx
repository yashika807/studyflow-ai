import { useEffect, useRef, useState } from 'react';
import { ErrorBox } from './Feedback.jsx';
import Icon from './Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { chatWithTutor } from '../services/gemini.js';

const GREETING = "Hi! I'm your study assistant. Ask me to explain a concept, make a study plan or quiz you.";
const SUGGESTIONS = ['Explain a concept in simple words', 'Make me a 3-day study plan', 'Give me tips to remember formulas'];

// Turns **bold** into <strong> without using innerHTML.
function formatInline(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) => (part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part));
}

// Very small formatter for the model's answer: paragraphs, "-" / "*" bullet lists and **bold**.
function MessageText({ text }) {
  const blocks = [];
  let list = [];
  const flush = () => {
    if (list.length) blocks.push({ type: 'list', items: list });
    list = [];
  };

  text.split('\n').forEach((raw) => {
    const line = raw.trim();
    const bullet = line.match(/^[-*•]\s+(.*)/);
    if (bullet) list.push(bullet[1]);
    else {
      flush();
      if (line) blocks.push({ type: 'p', text: line });
    }
  });
  flush();

  return blocks.map((b, i) =>
    b.type === 'list' ? (
      <ul key={i}>
        {b.items.map((item, j) => (
          <li key={j}>{formatInline(item)}</li>
        ))}
      </ul>
    ) : (
      <p key={i}>{formatInline(b.text)}</p>
    ),
  );
}

export default function ChatBot() {
  const { materials, apiKey } = useStudy();
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', text }
  const [input, setInput] = useState('');
  const [materialId, setMaterialId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const logRef = useRef(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [messages, loading]);

  const send = async (textToSend = input) => {
    const text = textToSend.trim();
    if (!text || loading) return;

    const history = [...messages, { role: 'user', text }];
    setMessages(history);
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const material = materials.find((m) => m.id === materialId) || null;
      const reply = await chatWithTutor(history, apiKey, material);
      setMessages([...history, { role: 'assistant', text: reply }]);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="card chat">
      <div className="card-title-row">
        <h3>
          <Icon name="bot" size={18} /> Study assistant
        </h3>
        <div className="chat-tools">
          <select value={materialId} onChange={(e) => setMaterialId(e.target.value)} aria-label="What should the assistant use?">
            <option value="">General study help</option>
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                Use: {m.title}
              </option>
            ))}
          </select>
          {messages.length > 0 && (
            <button className="btn btn-ghost btn-sm" onClick={() => setMessages([])}>
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="chat-log" ref={logRef} aria-live="polite">
        <div className="msg bot">
          <span className="msg-avatar">
            <Icon name="bot" size={16} />
          </span>
          <div className="bubble">{GREETING}</div>
        </div>

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
            {m.role !== 'user' && (
              <span className="msg-avatar">
                <Icon name="bot" size={16} />
              </span>
            )}
            <div className="bubble">{m.role === 'user' ? m.text : <MessageText text={m.text} />}</div>
          </div>
        ))}

        {loading && (
          <div className="msg bot">
            <span className="msg-avatar">
              <Icon name="bot" size={16} />
            </span>
            <div className="bubble typing" aria-label="The assistant is typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        {messages.length === 0 && (
          <div className="chips chat-suggestions">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip chip-button" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
      </div>

      <ErrorBox error={error} />

      <form
        className="chat-input"
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
      >
        <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKeyDown} rows={1} placeholder="Ask anything about your studies…" maxLength={1000} aria-label="Your message" />
        <button className="btn btn-primary" type="submit" disabled={loading || !input.trim()} aria-label="Send message">
          <Icon name="send" size={17} />
        </button>
      </form>
    </div>
  );
}
