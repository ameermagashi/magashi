import { useState } from 'react';
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

function navClass({ isActive }) {
  return isActive ? 'side-link active' : 'side-link';
}

export default function AppShell() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className={`app-shell${menuOpen ? ' menu-open' : ''}`}>
      <aside className="sidebar" aria-label="Application">
        <div className="sidebar-top">
          <NavLink to="/" className="brand" onClick={closeMenu}>
            Magashi Help Desk
          </NavLink>
          <p className="brand-sub">Internal IT support</p>
        </div>

        <nav className="side-nav" aria-label="Primary">
          <p className="side-label">Menu</p>
          <NavLink to="/" end className={navClass} onClick={closeMenu}>
            Dashboard
          </NavLink>
          <NavLink to="/tickets" className={navClass} onClick={closeMenu}>
            Tickets
          </NavLink>
          <NavLink to="/tickets/new" className={navClass} onClick={closeMenu}>
            New ticket
          </NavLink>
        </nav>

        <div className="sidebar-footer">
          <div className="user-meta">
            <span className="user-name">{user.name}</span>
            <span className="user-role">{roleLabel(user.role)}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-block" onClick={logout}>
            Sign out
          </button>
        </div>
      </aside>

      {menuOpen ? (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}

      <div className="content-area">
        <header className="content-bar">
          <button
            type="button"
            className="btn btn-ghost menu-toggle"
            aria-label="Open menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            Menu
          </button>
          <span className="content-bar-title">Help Desk</span>
        </header>

        <main className="main">
          <div className="main-inner">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
