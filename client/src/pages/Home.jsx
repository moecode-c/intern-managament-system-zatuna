import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Home() {
  const { user } = useAuth();

  return (
    <section className="card">
      <h1>El Zatuna Intern Management</h1>
      <p>
        Applications, onboarding, activity tracking and dashboards for the El Zatuna
        internship programme.
      </p>
      <div className="row">
        <Link className="btn" to="/apply">Apply for an internship</Link>
        {user ? (
          <Link className="btn" to="/dashboard">Go to dashboard</Link>
        ) : (
          <Link className="btn" to="/login">Staff log in</Link>
        )}
      </div>
    </section>
  );
}
