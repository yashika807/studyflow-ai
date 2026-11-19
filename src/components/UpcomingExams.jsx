import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { daysUntil, describeDaysLeft, formatEventDate, formatTime, sortEvents } from '../utils/calendar.js';

// Dashboard card with the next three exams / events.
export default function UpcomingExams() {
  const { events } = useStudy();
  const upcoming = sortEvents(events)
    .filter((e) => daysUntil(e.date) >= 0)
    .slice(0, 3);

  return (
    <div className="card">
      <div className="card-title-row">
        <h3>Upcoming exams</h3>
        <Link to="/calendar" className="small">
          Open calendar
        </Link>
      </div>

      {upcoming.length === 0 ? (
        <div className="mini-empty">
          <span className="stat-icon tone-primary">
            <Icon name="calendar" size={20} />
          </span>
          <p className="muted small">No upcoming exams. Add your exam dates in the calendar and they appear here.</p>
          <Link to="/calendar" className="btn btn-outline btn-sm">
            Add an exam
          </Link>
        </div>
      ) : (
        <ul className="step-list">
          {upcoming.map((e) => {
            const days = daysUntil(e.date);
            return (
              <li key={e.id}>
                <span>
                  <strong>{e.title}</strong>
                  <br />
                  <span className="muted small">
                    {formatEventDate(e.date)}
                    {e.time && ` · ${formatTime(e.time)}`}
                  </span>
                </span>
                <span className={`chip ${days <= 3 ? 'chip-danger' : days <= 7 ? 'chip-warn' : 'chip-primary'}`}>{describeDaysLeft(days)}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
