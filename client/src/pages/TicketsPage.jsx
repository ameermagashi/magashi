import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import {
  CATEGORIES,
  PRIORITIES,
  STATUSES,
  formatDate,
  priorityClass,
  statusClass,
} from '../constants';

const EMPTY_FILTERS = {
  q: '',
  status: '',
  priority: '',
  category: '',
};

export default function TicketsPage() {
  const { isOfficer } = useAuth();
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [applied, setApplied] = useState(EMPTY_FILTERS);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (applied.q) params.set('q', applied.q);
    if (applied.status) params.set('status', applied.status);
    if (applied.priority) params.set('priority', applied.priority);
    if (applied.category) params.set('category', applied.category);
    const qs = params.toString();
    return qs ? `?${qs}` : '';
  }, [applied]);

  useEffect(() => {
    let active = true;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const data = await api(`/tickets${queryString}`);
        if (active) setTickets(data.tickets || []);
      } catch (err) {
        if (active) setError(err.message || 'Unable to load tickets');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [queryString]);

  function updateFilter(field, value) {
    setFilters((prev) => ({ ...prev, [field]: value }));
  }

  function applyFilters(e) {
    e.preventDefault();
    setApplied({ ...filters });
  }

  function clearFilters() {
    setFilters(EMPTY_FILTERS);
    setApplied(EMPTY_FILTERS);
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Tickets</h1>
          <p className="muted">
            {isOfficer ? 'All submitted tickets.' : 'Tickets you have created.'}
          </p>
        </div>
        <Link to="/tickets/new" className="btn btn-primary">
          New ticket
        </Link>
      </div>

      <form className="filters" onSubmit={applyFilters}>
        <label className="field grow">
          <span>Search</span>
          <input
            type="search"
            placeholder="Search title or description"
            value={filters.q}
            onChange={(e) => updateFilter('q', e.target.value)}
          />
        </label>

        <label className="field">
          <span>Status</span>
          <select value={filters.status} onChange={(e) => updateFilter('status', e.target.value)}>
            <option value="">All</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Priority</span>
          <select
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value)}
          >
            <option value="">All</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          <span>Category</span>
          <select
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="">All</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="filter-actions">
          <button type="submit" className="btn btn-primary">
            Apply
          </button>
          <button type="button" className="btn btn-ghost" onClick={clearFilters}>
            Clear
          </button>
        </div>
      </form>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <section className="panel">
        {loading ? (
          <p className="muted panel-pad">Loading tickets…</p>
        ) : tickets.length === 0 ? (
          <div className="empty">
            <p>No tickets match these filters.</p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Category</th>
                  {isOfficer ? <th>Submitted by</th> : null}
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="mono">
                      <Link to={`/tickets/${ticket.id}`}>#{ticket.id}</Link>
                    </td>
                    <td>
                      <Link to={`/tickets/${ticket.id}`} className="table-title">
                        {ticket.title}
                      </Link>
                    </td>
                    <td>
                      <span className={statusClass(ticket.status)}>{ticket.status}</span>
                    </td>
                    <td>
                      <span className={priorityClass(ticket.priority)}>{ticket.priority}</span>
                    </td>
                    <td>{ticket.category}</td>
                    {isOfficer ? <td>{ticket.createdBy?.name}</td> : null}
                    <td className="muted">{formatDate(ticket.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
