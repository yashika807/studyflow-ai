import { useState } from 'react';
import Icon from './Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { formatDate } from '../utils/analytics.js';
import { parseYouTubeId, youTubeThumbnail, youTubeWatchUrl } from '../utils/youtube.js';

// Lets the student log the YouTube videos they learned from, per material and topic.
export default function VideosTab({ material }) {
  const { updateMaterial } = useStudy();
  const videos = material.videos || [];
  const topics = material.summary?.topics || [];

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const save = (e) => {
    e.preventDefault();
    const videoId = parseYouTubeId(url);
    if (!videoId) {
      setError('That does not look like a YouTube video link. Paste the full link from the address bar or the Share button.');
      return;
    }
    if (videos.some((v) => v.videoId === videoId)) {
      setError('You have already added this video.');
      return;
    }
    const video = {
      id: crypto.randomUUID(),
      videoId,
      title: title.trim() || 'YouTube video',
      topic,
      notes: notes.trim(),
      addedAt: Date.now(),
    };
    updateMaterial(material.id, { videos: [video, ...videos] });
    setUrl('');
    setTitle('');
    setTopic('');
    setNotes('');
    setError('');
  };

  const remove = (video) => {
    if (window.confirm(`Remove "${video.title}" from your list?`)) {
      updateMaterial(material.id, { videos: videos.filter((v) => v.id !== video.id) });
    }
  };

  return (
    <>
      <form className="card form" onSubmit={save}>
        <div>
          <h3>Videos I learned from</h3>
          <p className="muted">Paste the YouTube link of a video you watched, so you remember where you learned each topic.</p>
        </div>

        <label className="field">
          <span>YouTube link</span>
          <input type="text" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Video title (optional)</span>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. JDBC Batch Processing – Telusko" maxLength={100} />
          </label>

          <label className="field">
            <span>Topic it covered (optional)</span>
            <select value={topic} onChange={(e) => setTopic(e.target.value)}>
              <option value="">General / whole material</option>
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>What did you learn? (optional)</span>
          <textarea className="compact" rows={3}value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Explained addBatch() and executeBatch() with a demo. Watched 10:20 – 18:00." maxLength={400} />
        </label>

        {error && (
          <div className="alert alert-error" role="alert">
            {error}
          </div>
        )}

        <div>
          <button className="btn btn-primary" type="submit">
            <Icon name="plus" size={16} /> Add video
          </button>
        </div>
      </form>

      {videos.length > 0 && (
        <div className="video-list">
          {videos.map((v) => (
            <article key={v.id} className="card video-card">
              <a href={youTubeWatchUrl(v.videoId)} target="_blank" rel="noreferrer" className="video-thumb" aria-label={`Watch ${v.title} on YouTube`}>
                <img src={youTubeThumbnail(v.videoId)} alt="" loading="lazy" />
              </a>
              <div className="video-body">
                <h4>{v.title}</h4>
                <div className="chips">
                  <span className={`chip ${v.topic ? 'chip-primary' : ''}`}>{v.topic || 'General'}</span>
                  <span className="muted small">Added {formatDate(v.addedAt)}</span>
                </div>
                {v.notes && <p className="video-notes">{v.notes}</p>}
                <div className="row-gap">
                  <a className="btn btn-outline btn-sm" href={youTubeWatchUrl(v.videoId)} target="_blank" rel="noreferrer">
                    Watch again
                  </a>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => remove(v)} aria-label={`Remove ${v.title}`}>
                    <Icon name="trash" size={14} /> Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
