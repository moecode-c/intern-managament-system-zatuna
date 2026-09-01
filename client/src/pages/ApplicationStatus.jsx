import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client.js';

const STAGE_INFO = {
  applied:   { label: 'Application Received', icon: '📩', color: '#0d6e5c', description: 'Your application has been received and is in queue for review.' },
  screening: { label: 'Under Screening', icon: '🔍', color: '#C8CD06', description: 'Our team is reviewing your application and CV.' },
  interview: { label: 'Interview Stage', icon: '🎤', color: '#0a5548', description: 'Congratulations! You have been shortlisted for an interview.' },
  offer:     { label: 'Offer Extended', icon: '🎉', color: '#22c55e', description: 'An offer has been sent to you. Please check your email.' },
  accepted:  { label: 'Accepted', icon: '✅', color: '#10b981', description: 'Welcome aboard! You have been accepted into the programme.' },
  rejected:  { label: 'Not Selected', icon: '❌', color: '#dc3545', description: 'Unfortunately, your application was not selected this time.' },
};

const STAGE_ORDER = ['applied', 'screening', 'interview', 'offer', 'accepted'];

export default function ApplicationStatus() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function fetchStatus() {
      setLoading(true);
      setError('');
      try {
        const res = await api.get(`/applications/status/${token}`);
        if (!cancelled) setData(res.data.data);
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Could not load application status. Please check your link.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchStatus();
    return () => { cancelled = true; };
  }, [token]);

  if (loading) {
    return (
      <section className="card apply-card status-card">
        <div className="status-loading">
          <div className="spinner" />
          <p>Loading your application status...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card apply-card status-card">
        <div className="status-error-state">
          <svg viewBox="0 0 24 24" width="56" height="56" fill="none" stroke="var(--error)" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
          <h1>Status Not Found</h1>
          <p className="error">{error}</p>
          <div className="row" style={{ marginTop: '1rem', justifyContent: 'center' }}>
            <Link className="btn" to="/apply">Apply Now</Link>
            <Link className="btn btn-secondary" to="/">Home</Link>
          </div>
        </div>
      </section>
    );
  }

  const stage = STAGE_INFO[data.stage] || STAGE_INFO.applied;
  const isRejected = data.stage === 'rejected';
  const stageIndex = STAGE_ORDER.indexOf(data.stage);

  return (
    <section className="card apply-card status-card">
      <h1>Application Status</h1>

      {/* Applicant info */}
      <div className="status-applicant">
        <div className="status-avatar">{data.fullName.charAt(0).toUpperCase()}</div>
        <div>
          <p className="status-name">{data.fullName}</p>
          <p className="muted">{data.email}</p>
        </div>
      </div>

      <div className="status-meta-row">
        <div className="status-meta">
          <span className="muted">Track</span>
          <span className="status-meta-value">{data.track}</span>
        </div>
        <div className="status-meta">
          <span className="muted">Applied</span>
          <span className="status-meta-value">{new Date(data.appliedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Current stage badge */}
      <div className="status-current" style={{ '--stage-color': stage.color }}>
        <span className="status-icon">{stage.icon}</span>
        <div>
          <h2 className="status-stage-label">{stage.label}</h2>
          <p className="status-description">{stage.description}</p>
        </div>
      </div>

      {/* Pipeline progress (not shown for rejected) */}
      {!isRejected && (
        <div className="pipeline">
          {STAGE_ORDER.map((s, i) => {
            const info = STAGE_INFO[s];
            const isDone = i <= stageIndex;
            const isCurrent = i === stageIndex;
            return (
              <div key={s} className={`pipeline-step ${isDone ? 'done' : ''} ${isCurrent ? 'current' : ''}`}>
                <div className="pipeline-dot" />
                {i < STAGE_ORDER.length - 1 && <div className="pipeline-line" />}
                <span className="pipeline-label">{info.label}</span>
              </div>
            );
          })}
        </div>
      )}

      <div className="row" style={{ marginTop: '2rem', justifyContent: 'center' }}>
        <Link className="btn btn-secondary" to="/">Back to Home</Link>
      </div>
    </section>
  );
}
