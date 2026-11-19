import { useState } from 'react';
import Icon from '../components/Icon.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const HIGHLIGHTS = [
  { icon: 'file', text: 'Turn notes and PDFs into summaries' },
  { icon: 'target', text: 'Quizzes that find your weak topics' },
  { icon: 'calendar', text: 'Exam calendar with a countdown to every exam' },
  { icon: 'bot', text: 'A study assistant you can ask anything' },
];

export default function Login() {
  const { logIn, signUp } = useAuth();
  const [mode, setMode] = useState('login'); // login | signup
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === 'signup';
  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const switchMode = (next) => {
    setMode(next);
    setError('');
  };

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isSignUp) await signUp(form);
      else await logIn(form);
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
      setBusy(false);
    }
  };

  return (
    <div className="auth-shell">
      <section className="auth-hero">
        <div className="auth-brand">
          <span className="brand-mark">
            <Icon name="logo" size={22} />
          </span>
          <span>
            StudyFlow <strong>AI</strong>
          </span>
        </div>

        <h1>Turn study material into an active learning workflow.</h1>
        <p>Understand, practice, find your weak areas and revise — all in one place.</p>

        <ul className="auth-points">
          {HIGHLIGHTS.map((h) => (
            <li key={h.text}>
              <span>
                <Icon name={h.icon} size={18} />
              </span>
              {h.text}
            </li>
          ))}
        </ul>
      </section>

      <section className="auth-panel">
        <form className="auth-card" onSubmit={submit} noValidate>
          <div>
            <h2>{isSignUp ? 'Create your account' : 'Welcome back'}</h2>
            <p className="muted">{isSignUp ? 'Sign up to save your materials and progress.' : 'Log in to continue studying.'}</p>
          </div>

          <div className="segmented" role="tablist">
            <button type="button" role="tab" aria-selected={!isSignUp} className={!isSignUp ? 'active' : ''} onClick={() => switchMode('login')}>
              Log in
            </button>
            <button type="button" role="tab" aria-selected={isSignUp} className={isSignUp ? 'active' : ''} onClick={() => switchMode('signup')}>
              Sign up
            </button>
          </div>

          {isSignUp && (
            <label className="field">
              <span>Name</span>
              <input type="text" value={form.name} onChange={update('name')} placeholder="Your name" autoComplete="name" />
            </label>
          )}

          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={update('email')} placeholder="you@example.com" autoComplete="email" />
          </label>

          <label className="field">
            <span>Password</span>
            <div className="password-wrap">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={update('password')}
                placeholder={isSignUp ? 'At least 6 characters' : 'Your password'}
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />
              <button type="button" className="link-button" onClick={() => setShowPassword((s) => !s)}>
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </label>

          {error && (
            <div className="alert alert-error" role="alert">
              {error}
            </div>
          )}

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Please wait…' : isSignUp ? 'Create account' : 'Log in'}
          </button>

          <p className="muted small auth-note">Accounts are stored only in this browser (this is a front-end project with no server).</p>
        </form>
      </section>
    </div>
  );
}
