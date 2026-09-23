import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { roleLabel } from '../constants';

export function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-center">
        <p className="muted">Loading…</p>
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export function GuestRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="page-center">
        <p className="muted">Loading…</p>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return children;
}

export default function AppShell() {
  const { user, logout } = useAuth();

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <NavLink to="/" className="brand">
              Magashi Help Desk
            </NavLink>
            <span className="brand-sub">Internal IT support</span>
          </div>

          <nav className="nav" aria-label="Primary">
            <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Dashboard
            </NavLink>
            <NavLink to="/tickets" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              Tickets
            </NavLink>
            <NavLink to="/tickets/new" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              New ticket
            </NavLink>
          </nav>

          <div className="user-menu">
            <div className="user-meta">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{roleLabel(user.role)}</span>
            </div>
            <button type="button" className="btn btn-ghost" onClick={logout}>
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="main-inner">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
