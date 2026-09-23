import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { CATEGORIES, PRIORITIES } from '../constants';

export default function NewTicketPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    category: 'Software',
    description: '',
    priority: 'Medium',
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
      const data = await api('/tickets', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      navigate(`/tickets/${data.ticket.id}`);
    } catch (err) {
      setError(err.message || 'Unable to create ticket');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="page-header">
        <div>
          <h1>New ticket</h1>
          <p className="muted">Describe the IT problem clearly so officers can act quickly.</p>
        </div>
        <Link to="/tickets" className="btn btn-ghost">
          Cancel
        </Link>
      </div>

      <form className="panel form form-pad" onSubmit={handleSubmit}>
        {error ? <div className="alert alert-error">{error}</div> : null}

        <label className="field">
          <span>Title</span>
          <input
            type="text"
            required
            minLength={3}
            maxLength={200}
            placeholder="Short summary of the issue"
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
          />
        </label>

        <div className="field-row">
          <label className="field">
            <span>Category</span>
            <select
              required
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Priority</span>
            <select
              required
              value={form.priority}
              onChange={(e) => update('priority', e.target.value)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="field">
          <span>Description</span>
          <textarea
            required
            minLength={10}
            rows={7}
            placeholder="What happened, when it started, and any steps already tried"
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />
        </label>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit ticket'}
          </button>
        </div>
      </form>
    </div>
  );
}
