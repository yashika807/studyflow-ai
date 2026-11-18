import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import { Loader } from '../components/Feedback.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { sampleMaterial } from '../data/sampleMaterial.js';
import { extractTextFromPdf } from '../services/pdf.js';
import { wordCount } from '../utils/analytics.js';

const MIN_CHARS = 200;
const AI_LIMIT = 24000;

export default function AddMaterial() {
  const { addMaterial } = useStudy();
  const navigate = useNavigate();
  const fileInput = useRef(null);

  const [mode, setMode] = useState('paste'); // paste | pdf
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [fileInfo, setFileInfo] = useState(null);
  const [reading, setReading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please choose a PDF file.');
      return;
    }
    setError('');
    setReading(true);
    try {
      const { text: extracted, pages } = await extractTextFromPdf(file);
      if (extracted.length < 50) {
        setError('No readable text found. This may be a scanned PDF — try pasting the text instead.');
      } else {
        setText(extracted);
        setFileInfo({ name: file.name, pages });
        if (!title.trim()) setTitle(file.name.replace(/\.pdf$/i, ''));
      }
    } catch {
      setError('Could not read this PDF. Try another file or paste the text.');
    } finally {
      setReading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return setError('Please give your material a title.');
    if (text.trim().length < MIN_CHARS) return setError(`Add a bit more text (at least ${MIN_CHARS} characters) so the AI has something to work with.`);
    const id = addMaterial({ title: title.trim(), text: text.trim(), source: mode });
    navigate(`/materials/${id}`);
  };

  const trySample = () => navigate(`/materials/${addMaterial(sampleMaterial)}`);

  return (
    <div className="page narrow">
      <header className="page-head">
        <div>
          <h1>Add study material</h1>
          <p className="muted">Paste your notes or upload a PDF. Nothing leaves your browser except the text sent to the AI.</p>
        </div>
      </header>

      <form className="card form" onSubmit={handleSubmit}>
        <label className="field">
          <span>Title</span>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. DBMS – Normalization" maxLength={80} />
        </label>

        <div className="segmented" role="tablist">
          <button type="button" role="tab" aria-selected={mode === 'paste'} className={mode === 'paste' ? 'active' : ''} onClick={() => setMode('paste')}>
            Paste text
          </button>
          <button type="button" role="tab" aria-selected={mode === 'pdf'} className={mode === 'pdf' ? 'active' : ''} onClick={() => setMode('pdf')}>
            Upload PDF
          </button>
        </div>

        {mode === 'pdf' && (
          <div
            className={`dropzone${dragging ? ' dragging' : ''}`}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              handleFile(e.dataTransfer.files[0]);
            }}
          >
            <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => handleFile(e.target.files[0])} />
            {reading ? (
              <Loader message="Reading PDF…" />
            ) : fileInfo ? (
              <p>
                <Icon name="file" size={18} /> <strong>{fileInfo.name}</strong> · {fileInfo.pages} page(s) read
              </p>
            ) : (
              <p className="muted">
                <Icon name="upload" size={22} />
                <br />
                Drag a PDF here or choose a file
              </p>
            )}
            <button type="button" className="btn btn-outline btn-sm" onClick={() => fileInput.current.click()} disabled={reading}>
              {fileInfo ? 'Choose another PDF' : 'Choose PDF'}
            </button>
          </div>
        )}

        {(mode === 'paste' || text) && (
          <label className="field">
            <span>{mode === 'pdf' ? 'Extracted text (you can edit it)' : 'Your notes'}</span>
            <textarea rows={12} value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your notes, a textbook chapter or an article here…" />
            <small className="muted">
              {wordCount(text).toLocaleString()} words
              {text.length > AI_LIMIT && ` · only the first ${AI_LIMIT.toLocaleString()} characters are used by the AI`}
            </small>
          </label>
        )}

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div className="row-gap">
          <button type="submit" className="btn btn-primary">
            Save material
          </button>
          <button type="button" className="btn btn-ghost" onClick={trySample}>
            Use sample material instead
          </button>
        </div>
      </form>
    </div>
  );
}
