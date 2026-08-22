import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app">
      <header className="topbar">
        <Link to="/" className="brand">El Zatuna</Link>

        <nav className="nav">
          {user && <NavLink to="/dashboard">Dashboard</NavLink>}
          {user && ['admin', 'mentor'].includes(user.role) && (
            <>
              <NavLink to="/applications">Applications</NavLink>
              <NavLink to="/interns">Interns</NavLink>
            </>
          )}
          {user && <NavLink to="/tasks">Tasks</NavLink>}
          {user && <NavLink to="/activities">Activities</NavLink>}
          <NavLink to="/apply">Apply</NavLink>
        </nav>

        <div className="user-area">
          {user ? (
            <>
              <span className="muted">{user.name} ({user.role})</span>
              <button type="button" onClick={handleLogout}>Log out</button>
            </>
          ) : (
            <Link to="/login">Log in</Link>
          )}
        </div>
      </header>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
