import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { statusClass } from '../constants';

export default function DashboardPage() {
  const { isOfficer } = useAuth();
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const [statsData, ticketsData] = await Promise.all([
          api('/tickets/stats'),
          api('/tickets'),
        ]);
        if (!active) return;
        setStats(statsData);
        setRecent((ticketsData.tickets || []).slice(0, 5));
      } catch (err) {
        if (active) setError(err.message || 'Unable to load dashboard');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">
            {isOfficer
              ? 'Overview of all tickets across the organisation.'
              : 'Overview of tickets you have submitted.'}
          </p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          New ticket
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      {loading ? (
        <p className="muted">Loading dashboard…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat">
              <span className="stat-label">Total</span>
              <span className="stat-value">{stats?.total ?? 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Open</span>
              <span className="stat-value">{stats?.open ?? 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">In progress</span>
              <span className="stat-value">{stats?.inProgress ?? 0}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Resolved</span>
              <span className="stat-value">{stats?.resolved ?? 0}</span>
            </div>
          </div>

          <section className="panel">
            <div className="panel-header">
              <h2>Recent tickets</h2>
              <Link to="/tickets" className="text-link">
                View all
              </Link>
            </div>

            {recent.length === 0 ? (
              <div className="empty">
                <p>No tickets yet.</p>
                <Link to="/tickets/new" className="btn btn-primary">
                  Create your first ticket
                </Link>
              </div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((ticket) => (
                    <tr key={ticket.id}>
                      <td className="mono">
                        <Link to={`/tickets/${ticket.id}`}>#{ticket.id}</Link>
                      </td>
                      <td>
                        <Link to={`/tickets/${ticket.id}`}>{ticket.title}</Link>
                      </td>
                      <td>
                        <span className={statusClass(ticket.status)}>
                          {ticket.status}
                        </span>
                      </td>
                      <td>{ticket.priority}</td>
                      <td>{ticket.category}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </div>
  );
}
