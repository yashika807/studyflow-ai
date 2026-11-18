import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';

export function Loader({ message = 'Working on it…' }) {
  return (
    <div className="loader" role="status">
      <span className="spinner" />
      <span>{message}</span>
    </div>
  );
}

export function ErrorBox({ error }) {
  if (!error) return null;
  const needsKey = error.code === 'NO_API_KEY' || error.code === 'BAD_KEY';
  return (
    <div className="alert alert-error" role="alert">
      <span>{error.message || String(error)}</span>
      {needsKey && (
        <Link to="/settings" className="alert-link">
          Open Settings
        </Link>
      )}
    </div>
  );
}

export function EmptyState({ icon = 'file', title, text, children }) {
  return (
    <div className="empty">
      <span className="empty-icon">
        <Icon name={icon} size={26} />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {children && <div className="empty-actions">{children}</div>}
    </div>
  );
}

// Shown inside a tab when its AI content has not been generated yet.
export function GenerateCard({ title, text, buttonLabel, onGenerate, loading, error, loadingMessage }) {
  return (
    <div className="card center-card">
      <span className="empty-icon">
        <Icon name="sparkle" size={26} />
      </span>
      <h3>{title}</h3>
      <p className="muted">{text}</p>
      {loading ? (
        <Loader message={loadingMessage} />
      ) : (
        <button className="btn btn-primary" onClick={onGenerate}>
          <Icon name="sparkle" size={16} /> {buttonLabel}
        </button>
      )}
      <ErrorBox error={error} />
    </div>
  );
}
