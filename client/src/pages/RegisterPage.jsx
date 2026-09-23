import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await register(form);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message || 'Unable to create account');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-panel">
        <div className="auth-header">
          <p className="auth-brand">Magashi Help Desk</p>
          <h1>Create account</h1>
          <p className="muted">Register as staff or as an IT officer.</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          {error ? <div className="alert alert-error" role="alert">{error}</div> : null}

          <label className="field">
            <span>Full name</span>
            <input
              type="text"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Email</span>
            <input
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
            />
          </label>

          <label className="field">
            <span>Password</span>
            <input
              type="password"
              autoComplete="new-password"
              required
              minLength={6}
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
            />
          </label>

          <fieldset className="field">
            <legend>Role</legend>
            <div className="radio-row">
              <label className="radio">
                <input
                  type="radio"
                  name="role"
                  value="staff"
                  checked={form.role === 'staff'}
                  onChange={() => update('role', 'staff')}
                />
                Staff
              </label>
              <label className="radio">
                <input
                  type="radio"
                  name="role"
                  value="it_officer"
                  checked={form.role === 'it_officer'}
                  onChange={() => update('role', 'it_officer')}
                />
                IT Officer
              </label>
            </div>
          </fieldset>

          <button className="btn btn-primary btn-block" type="submit" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
