import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  formatDate,
  nextStatuses,
  priorityClass,
  roleLabel,
  statusClass,
} from '../constants';

export default function TicketDetailPage() {
  const { id } = useParams();
  const { isOfficer } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [comment, setComment] = useState('');
  const [asResolution, setAsResolution] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');

  async function loadTicket() {
    setLoading(true);
    setError('');
    try {
      const data = await api(`/tickets/${id}`);
      setTicket(data.ticket);
    } catch (err) {
      setError(err.message || 'Unable to load ticket');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTicket();
  }, [id]);

  async function updateStatus(status) {
    setBusy(true);
    setActionError('');
    try {
      const data = await api(`/tickets/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setTicket((prev) => ({ ...prev, ...data.ticket, comments: prev.comments }));
    } catch (err) {
      setActionError(err.message || 'Unable to update status');
    } finally {
      setBusy(false);
    }
  }

  async function submitComment(e) {
    e.preventDefault();
    if (!comment.trim()) return;
    setBusy(true);
    setActionError('');
    try {
      const data = await api(`/tickets/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({
          body: comment.trim(),
          isResolution: asResolution,
        }),
      });
      setComment('');
      setAsResolution(false);
      if (asResolution) {
        await loadTicket();
      } else {
        setTicket((prev) => ({
          ...prev,
          comments: [...(prev.comments || []), data.comment],
        }));
      }
    } catch (err) {
      setActionError(err.message || 'Unable to add comment');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading ticket…</p>
      </div>
    );
  }

  if (error || !ticket) {
    return (
      <div className="page">
        <div className="alert alert-error">{error || 'Ticket not found'}</div>
        <Link to="/tickets" className="btn btn-ghost">
          Back to tickets
        </Link>
      </div>
    );
  }

  const transitions = isOfficer ? nextStatuses(ticket.status) : [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <p className="crumb">
            <Link to="/tickets">Tickets</Link>
            <span aria-hidden="true"> / </span>
            <span className="mono">#{ticket.id}</span>
          </p>
          <h1>{ticket.title}</h1>
        </div>
        <div className="header-badges">
          <span className={statusClass(ticket.status)}>{ticket.status}</span>
          <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
        </div>
      </div>

      {actionError ? <div className="alert alert-error">{actionError}</div> : null}

      <div className="detail-layout">
        <section className="panel">
          <div className="panel-header">
            <h2>Details</h2>
          </div>
          <div className="detail-body">
            <dl className="meta-list">
              <div>
                <dt>Category</dt>
                <dd>{ticket.category}</dd>
              </div>
              <div>
                <dt>Submitted by</dt>
                <dd>{ticket.createdBy?.name}</dd>
              </div>
              <div>
                <dt>Created</dt>
                <dd>{formatDate(ticket.createdAt)}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{formatDate(ticket.updatedAt)}</dd>
              </div>
              {ticket.assignedTo ? (
                <div>
                  <dt>Assigned to</dt>
                  <dd>{ticket.assignedTo.name}</dd>
                </div>
              ) : null}
            </dl>

            <div className="description-block">
              <h3>Description</h3>
              <p className="description-text">{ticket.description}</p>
            </div>
          </div>
        </section>

        <aside className="side-stack">
          {isOfficer ? (
            <section className="panel">
              <div className="panel-header">
                <h2>Status</h2>
              </div>
              <div className="panel-pad">
                <p className="muted small">
                  Workflow: Open → In Progress → Resolved
                </p>
                {transitions.length === 0 ? (
                  <p className="muted">This ticket is resolved. No further status changes.</p>
                ) : (
                  <div className="action-stack">
                    {transitions.map((status) => (
                      <button
                        key={status}
                        type="button"
                        className="btn btn-primary btn-block"
                        disabled={busy}
                        onClick={() => updateStatus(status)}
                      >
                        Mark as {status}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </section>
          ) : null}

          <section className="panel">
            <div className="panel-header">
              <h2>Activity</h2>
            </div>
            <div className="panel-pad">
              {(ticket.comments || []).length === 0 ? (
                <p className="muted">No comments yet.</p>
              ) : (
                <ul className="comment-list">
                  {ticket.comments.map((c) => (
                    <li key={c.id} className={c.isResolution ? 'comment resolution' : 'comment'}>
                      <div className="comment-meta">
                        <strong>{c.user.name}</strong>
                        <span className="muted">{roleLabel(c.user.role)}</span>
                        <span className="muted">{formatDate(c.createdAt)}</span>
                      </div>
                      {c.isResolution ? (
                        <span className="badge badge-resolved">Resolution</span>
                      ) : null}
                      <p>{c.body}</p>
                    </li>
                  ))}
                </ul>
              )}

              <form className="comment-form" onSubmit={submitComment}>
                <label className="field">
                  <span>{isOfficer ? 'Comment or resolution' : 'Add a comment'}</span>
                  <textarea
                    rows={4}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      isOfficer
                        ? 'Update the requester or record how the issue was fixed'
                        : 'Add more detail for the IT team'
                    }
                  />
                </label>

                {isOfficer ? (
                  <label className="check">
                    <input
                      type="checkbox"
                      checked={asResolution}
                      onChange={(e) => setAsResolution(e.target.checked)}
                    />
                    Mark as resolution (sets status to Resolved)
                  </label>
                ) : null}

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={busy || !comment.trim()}
                >
                  {busy ? 'Saving…' : 'Post'}
                </button>
              </form>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
