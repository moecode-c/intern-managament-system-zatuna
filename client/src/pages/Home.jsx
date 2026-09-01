import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <section className="home-hero">
      <div className="home-hero-badge">Intern Management System</div>

      <h1>
        El Zatuna<br />
        <em>Internship Programme</em>
      </h1>

      <p className="home-hero-subtitle">
        Applications, onboarding, activity tracking and dashboards —
        everything you need for the El Zatuna internship, in one place.
      </p>

      <div className="home-hero-actions">
        <Link className="btn" to="/apply">
          Apply for an Internship
        </Link>
        {user ? (
          <Link className="btn btn-secondary" to="/dashboard">
            Go to Dashboard
          </Link>
        ) : (
          <Link className="btn btn-secondary" to="/login">
            Staff Log in
          </Link>
        )}
      </div>

      <div className="home-stats">
        <div className="home-stat">
          <div className="home-stat-value">7</div>
          <div className="home-stat-label">Tracks</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-value">Join</div>
          <div className="home-stat-label">The Cohort</div>
        </div>
        <div className="home-stat">
          <div className="home-stat-value">🫒</div>
          <div className="home-stat-label">Zatuna</div>
        </div>
      </div>
    </section>
  );
}
