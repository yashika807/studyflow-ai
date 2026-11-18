import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Feedback.jsx';

export default function NotFound() {
  return (
    <div className="page">
      <div className="card">
        <EmptyState icon="file" title="Page not found" text="The page you are looking for does not exist.">
          <Link to="/" className="btn btn-primary">
            Back to dashboard
          </Link>
        </EmptyState>
      </div>
    </div>
  );
}
