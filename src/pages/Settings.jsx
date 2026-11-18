import { useState } from 'react';
import { useStudy } from '../context/StudyContext.jsx';

export default function Settings() {
  const { apiKey, setApiKey, resetAll, materials } = useStudy();
  const [value, setValue] = useState(apiKey);
  const [saved, setSaved] = useState(false);

  const save = (e) => {
    e.preventDefault();
    setApiKey(value.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    if (window.confirm('This deletes all materials, quizzes and progress stored in this browser. Continue?')) resetAll();
  };

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>Settings</h1>
          <p className="muted">Configure the AI and manage your saved data.</p>
        </div>
      </header>

      <form className="card form" onSubmit={save}>
        <h3>Gemini API key</h3>
        <p className="muted">
          StudyFlow calls Google's Gemini API directly from your browser. Get a free key from{' '}
          <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
            Google AI Studio
          </a>
          . The key is stored only in this browser.
        </p>
        <label className="field">
          <span>API key</span>
          <input type="password" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Paste your key here" autoComplete="off" />
        </label>
        <div className="row-gap">
          <button className="btn btn-primary" type="submit">
            Save key
          </button>
          {saved && <span className="saved">Saved ✓</span>}
        </div>
      </form>

      <div className="card form">
        <h3>Your data</h3>
        <p className="muted">
          {materials.length} material(s) saved in this browser (localStorage). Nothing is uploaded to a server.
        </p>
        <div>
          <button className="btn btn-danger" onClick={handleReset} disabled={materials.length === 0}>
            Delete all data
          </button>
        </div>
      </div>
    </div>
  );
}
