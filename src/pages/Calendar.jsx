import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useStudy } from '../context/StudyContext.jsx';
import { buildMonthGrid, daysUntil, describeDaysLeft, formatEventDate, formatTime, monthLabel, parseISODate, sortEvents, toISODate } from '../utils/calendar.js';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function CalendarPage() {
  const { events, addEvents, deleteEvent } = useStudy();

  const now = new Date();
  const [view, setView] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [message, setMessage] = useState(null); // { type: 'error' | 'success' | 'info', text }
  const [form, setForm] = useState({ title: '', date: '', time: '' });

  const todayISO = toISODate(now);
  const sorted = sortEvents(events);
  const eventsByDate = sorted.reduce((map, e) => {
    (map[e.date] ||= []).push(e);
    return map;
  }, {});
  const grid = buildMonthGrid(view.year, view.month);

  const moveMonth = (step) => {
    const d = new Date(view.year, view.month + step, 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };
  const goToday = () => setView({ year: now.getFullYear(), month: now.getMonth() });

  const addEvent = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.date) {
      setMessage({ type: 'error', text: 'Enter a title and a date.' });
      return;
    }
    const added = addEvents([{ ...form, source: 'manual' }]);
    if (added) {
      setMessage({ type: 'success', text: 'Added to your calendar.' });
      setView({ year: +form.date.slice(0, 4), month: +form.date.slice(5, 7) - 1 }); // jump to the month of the new event
    } else {
      setMessage({ type: 'info', text: 'That event is already on your calendar.' });
    }
    setForm({ title: '', date: '', time: '' });
  };

  const removeEvent = (event) => {
    if (window.confirm(`Remove "${event.title}" from your calendar?`)) deleteEvent(event.id);
  };

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <h1>Exam calendar</h1>
          <p className="muted">Add your exams and other events, and see how many days are left.</p>
        </div>
      </header>

      <div className="cal-layout">
        {/* ---------- month view ---------- */}
        <section className="card">
          <div className="cal-head">
            <h3>{monthLabel(view.year, view.month)}</h3>
            <div className="cal-nav">
              <button className="btn btn-ghost btn-sm" onClick={goToday}>
                Today
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => moveMonth(-1)} aria-label="Previous month">
                ‹
              </button>
              <button className="btn btn-outline btn-sm" onClick={() => moveMonth(1)} aria-label="Next month">
                ›
              </button>
            </div>
          </div>

          <div className="cal-grid" role="grid" aria-label={monthLabel(view.year, view.month)}>
            {WEEKDAYS.map((d) => (
              <div key={d} className="cal-dow" role="columnheader">
                {d}
              </div>
            ))}
            {grid.map((cell) => {
              const dayEvents = eventsByDate[cell.iso] || [];
              return (
                <div key={cell.iso} role="gridcell" className={`cal-cell${cell.inMonth ? '' : ' out'}${cell.iso === todayISO ? ' today' : ''}`}>
                  <span className="cal-day">{cell.day}</span>
                  {dayEvents.slice(0, 2).map((e) => {
                    const days = daysUntil(e.date, now);
                    return (
                      <span key={e.id} className={`cal-event${days >= 0 && days <= 7 ? ' soon' : ''}`} title={`${e.title}${e.time ? ` · ${formatTime(e.time)}` : ''}`}>
                        {e.title}
                      </span>
                    );
                  })}
                  {dayEvents.length > 2 && <span className="cal-more">+{dayEvents.length - 2} more</span>}
                </div>
              );
            })}
          </div>
        </section>

        {/* ---------- add an event ---------- */}
        <form className="card form" onSubmit={addEvent}>
          <div>
            <h3>Add an exam or event</h3>
            <p className="muted small">For example "DBMS exam" or "Project submission".</p>
          </div>

          <label className="field">
            <span>Title</span>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. DBMS exam" maxLength={80} />
          </label>

          <div className="field-row">
            <label className="field">
              <span>Date</span>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </label>
            <label className="field">
              <span>Time (optional)</span>
              <input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} />
            </label>
          </div>

          {message && (
            <div className={`alert ${message.type === 'error' ? 'alert-error' : message.type === 'success' ? 'alert-success' : 'alert-warn'}`} role={message.type === 'error' ? 'alert' : 'status'}>
              {message.text}
            </div>
          )}

          <div>
            <button className="btn btn-primary" type="submit">
              <Icon name="plus" size={16} /> Add to calendar
            </button>
          </div>
        </form>
      </div>

      {/* ---------- list of all events ---------- */}
      <section className="card">
        <h3>All exams &amp; events</h3>
        {sorted.length === 0 ? (
          <p className="muted">Nothing here yet. Add your first exam above.</p>
        ) : (
          <ul className="event-list">
            {sorted.map((e) => {
              const days = daysUntil(e.date, now);
              const tone = days < 0 ? '' : days <= 3 ? 'chip-danger' : days <= 7 ? 'chip-warn' : 'chip-primary';
              return (
                <li key={e.id} className={days < 0 ? 'past' : ''}>
                  <div className="event-date">
                    <strong>{parseISODate(e.date).getDate()}</strong>
                    <span>{parseISODate(e.date).toLocaleDateString(undefined, { month: 'short' })}</span>
                  </div>
                  <div className="event-body">
                    <strong>{e.title}</strong>
                    <span className="muted small">
                      {formatEventDate(e.date)}
                      {e.time && ` · ${formatTime(e.time)}`}
                    </span>
                  </div>
                  <span className={`chip ${tone}`}>{describeDaysLeft(days)}</span>
                  <button className="btn btn-ghost btn-sm danger" onClick={() => removeEvent(e)} aria-label={`Remove ${e.title}`}>
                    <Icon name="trash" size={15} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
