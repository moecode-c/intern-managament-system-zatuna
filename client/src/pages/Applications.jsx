import { useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';

const PAGE_SIZE = 10;
const STAGES = ['applied', 'screening', 'interview', 'offer', 'accepted', 'rejected'];
const TRACKS = ['frontend', 'backend', 'fullstack', 'mobile', 'design', 'qa', 'data'];
const STAGE_LABELS = {
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  accepted: 'Accepted',
  rejected: 'Rejected',
};
const TRACK_LABELS = {
  frontend: 'Frontend',
  backend: 'Backend',
  fullstack: 'Fullstack',
  mobile: 'Mobile',
  design: 'Design',
  qa: 'QA',
  data: 'Data',
};

const buildApiError = (error, fallback) => {
  if (error?.response?.status === 501) {
    return 'This backend action is not available yet. The stage and review routes are still being merged.';
  }

  return error?.response?.data?.message || error?.message || fallback;
};

const normalizeCvUrl = (value) => {
  if (!value) return '#';
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) return value;
  if (value.startsWith('/')) return value;
  return `/${value.replace(/^\.?\//, '')}`;
};

export default function Applications() {
  const [view, setView] = useState('table');
  const [applications, setApplications] = useState([]);
  const [filters, setFilters] = useState({ stage: '', track: '', q: '' });
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApp, setSelectedApp] = useState(null);
  const [reviewForm, setReviewForm] = useState({ score: '', notes: '' });
  const [reviewState, setReviewState] = useState({ busy: false, message: '', type: '' });
  const [boardState, setBoardState] = useState({ message: '', type: '' });
  const [draggedId, setDraggedId] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => (prev.q === searchInput.trim() ? prev : { ...prev, q: searchInput.trim() }));
      setPage(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    const fetchApplications = async () => {
      setLoading(true);
      setError('');

      try {
        const params = {
          page,
          limit: PAGE_SIZE,
          stage: filters.stage || undefined,
          track: filters.track || undefined,
          q: filters.q || undefined,
        };

        const res = await api.get('/applications', { params });
        const payload = res.data?.data || { items: [], total: 0, page: 1 };

        setApplications(payload.items || []);
        setTotal(payload.total || 0);
        setPage(Number(payload.page || 1));
      } catch (err) {
        setApplications([]);
        setTotal(0);
        setError(buildApiError(err, 'Failed to load applications.'));
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [filters.stage, filters.track, filters.q, page]);

  useEffect(() => {
    if (selectedApp && !applications.some((app) => app._id === selectedApp._id)) {
      setSelectedApp(null);
    }
  }, [applications, selectedApp]);

  useEffect(() => {
    setReviewForm({ score: '', notes: '' });
    setReviewState({ busy: false, message: '', type: '' });
  }, [selectedApp?._id]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const boardColumns = useMemo(
    () => STAGES.map((stage) => ({ stage, items: applications.filter((app) => app.stage === stage) })),
    [applications]
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleStageMove = async (applicationId, targetStage) => {
    const currentApp = applications.find((app) => app._id === applicationId);
    if (!currentApp || currentApp.stage === targetStage) return;

    const previousStage = currentApp.stage;

    setApplications((prev) =>
      prev.map((app) => (app._id === applicationId ? { ...app, stage: targetStage } : app))
    );
    setSelectedApp((prev) => (prev && prev._id === applicationId ? { ...prev, stage: targetStage } : prev));
    setBoardState({ type: 'info', message: `Moving to ${STAGE_LABELS[targetStage]}...` });

    try {
      await api.patch(`/applications/${applicationId}/stage`, { stage: targetStage });
      setBoardState({ type: 'success', message: `Moved to ${STAGE_LABELS[targetStage]}.` });
    } catch (err) {
      setApplications((prev) =>
        prev.map((app) => (app._id === applicationId ? { ...app, stage: previousStage } : app))
      );
      setSelectedApp((prev) =>
        prev && prev._id === applicationId ? { ...prev, stage: previousStage } : prev
      );
      setBoardState({
        type: 'error',
        message: buildApiError(err, 'Could not move this application.'),
      });
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!selectedApp) return;
    if (!reviewForm.score) {
      setReviewState({ busy: false, message: 'Choose a score before submitting.', type: 'error' });
      return;
    }

    setReviewState({ busy: true, message: '', type: '' });

    try {
      await api.post(`/applications/${selectedApp._id}/reviews`, {
        score: Number(reviewForm.score),
        notes: reviewForm.notes.trim(),
      });

      setReviewState({
        busy: false,
        message: 'Review saved successfully.',
        type: 'success',
      });
      setReviewForm({ score: '', notes: '' });
    } catch (err) {
      setReviewState({
        busy: false,
        message: buildApiError(err, 'The review endpoint is unavailable right now.'),
        type: 'error',
      });
    }
  };

  return (
    <section className="content applications-page">
      <div className="page-header">
        <div>
          <p className="eyebrow">ATS</p>
          <h1>Applications</h1>
        </div>

        <div className="view-toggle" aria-label="Application view toggle">
          <button
            type="button"
            className={view === 'table' ? 'tab active' : 'tab'}
            onClick={() => setView('table')}
          >
            Table
          </button>
          <button
            type="button"
            className={view === 'kanban' ? 'tab active' : 'tab'}
            onClick={() => setView('kanban')}
          >
            Kanban
          </button>
        </div>
      </div>

      <div className="card toolbar">
        <div className="filters-row">
          <label>
            Stage
            <select value={filters.stage} onChange={(e) => handleFilterChange('stage', e.target.value)}>
              <option value="">All stages</option>
              {STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {STAGE_LABELS[stage]}
                </option>
              ))}
            </select>
          </label>

          <label>
            Track
            <select value={filters.track} onChange={(e) => handleFilterChange('track', e.target.value)}>
              <option value="">All tracks</option>
              {TRACKS.map((track) => (
                <option key={track} value={track}>
                  {TRACK_LABELS[track]}
                </option>
              ))}
            </select>
          </label>

          <label className="search-field">
            Search
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by name"
            />
          </label>
        </div>
      </div>

      {error && <div className="notice error">{error}</div>}
      {boardState.message && (
        <div className={`notice ${boardState.type || 'info'}`}>{boardState.message}</div>
      )}

      {loading ? (
        <div className="empty-state">Loading applications...</div>
      ) : applications.length === 0 ? (
        <div className="empty-state">No applications match your current filters.</div>
      ) : view === 'table' ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Track</th>
                <th>Stage</th>
                <th>University</th>
                <th>Email</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app._id}>
                  <td>
                    <button type="button" className="link-button" onClick={() => setSelectedApp(app)}>
                      {app.fullName}
                    </button>
                  </td>
                  <td>{TRACK_LABELS[app.track] || app.track}</td>
                  <td>
                    <span className={`stage-badge ${app.stage}`}>{STAGE_LABELS[app.stage] || app.stage}</span>
                  </td>
                  <td>{app.university || '—'}</td>
                  <td>{app.email || '—'}</td>
                  <td>
                    <button type="button" className="secondary-btn" onClick={() => setSelectedApp(app)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="pagination">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
              Previous
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page >= totalPages}
            >
              Next
            </button>
          </div>
        </div>
      ) : (
        <div className="kanban-board">
          {boardColumns.map(({ stage, items }) => (
            <div
              key={stage}
              className="kanban-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedId) {
                  handleStageMove(draggedId, stage);
                  setDraggedId(null);
                }
              }}
            >
              <header>
                <h2>{STAGE_LABELS[stage]}</h2>
                <span>{items.length}</span>
              </header>

              {items.length === 0 ? (
                <div className="kanban-empty">No applicants</div>
              ) : (
                items.map((app) => (
                  <article
                    key={app._id}
                    className="kanban-card"
                    draggable
                    onDragStart={(event) => {
                      event.dataTransfer.setData('application/id', app._id);
                      setDraggedId(app._id);
                    }}
                    onDragEnd={() => setDraggedId(null)}
                    onClick={() => setSelectedApp(app)}
                  >
                    <div className="card-topline">
                      <strong>{app.fullName}</strong>
                      <span>{TRACK_LABELS[app.track] || app.track}</span>
                    </div>
                    <p>{app.email}</p>
                  </article>
                ))
              )}
            </div>
          ))}
        </div>
      )}

      {selectedApp && (
        <aside className="detail-drawer">
          <div className="drawer-header">
            <div>
              <p className="eyebrow">Applicant</p>
              <h2>{selectedApp.fullName}</h2>
            </div>
            <button type="button" className="close-btn" onClick={() => setSelectedApp(null)}>
              ×
            </button>
          </div>

          <dl className="detail-grid">
            <div>
              <dt>Track</dt>
              <dd>{TRACK_LABELS[selectedApp.track] || selectedApp.track}</dd>
            </div>
            <div>
              <dt>Stage</dt>
              <dd>{STAGE_LABELS[selectedApp.stage] || selectedApp.stage}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{selectedApp.email}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{selectedApp.phone || '—'}</dd>
            </div>
            <div>
              <dt>University</dt>
              <dd>{selectedApp.university || '—'}</dd>
            </div>
            <div>
              <dt>Major</dt>
              <dd>{selectedApp.major || '—'}</dd>
            </div>
          </dl>

          <div className="detail-links">
            {selectedApp.cvPath ? (
              <a href={normalizeCvUrl(selectedApp.cvPath)} target="_blank" rel="noreferrer">
                Open CV
              </a>
            ) : (
              <span className="muted">No CV attached</span>
            )}
            {selectedApp.portfolioUrl && (
              <a href={selectedApp.portfolioUrl} target="_blank" rel="noreferrer">
                Portfolio
              </a>
            )}
          </div>

          <div className="detail-section">
            <h3>Cover letter</h3>
            <p>{selectedApp.coverLetter || 'No cover letter provided.'}</p>
          </div>

          <div className="detail-section">
            <h3>Reviews</h3>
            {selectedApp.reviews?.length ? (
              <ul className="review-list">
                {selectedApp.reviews.map((review, index) => (
                  <li key={`${review.reviewer?._id || review.reviewer || 'review'}-${index}`}>
                    <div className="review-meta">
                      <strong>{review.reviewer?.name || 'Reviewer'}</strong>
                      <span>{'★'.repeat(review.score || 0)}{review.score ? '' : '—'}</span>
                    </div>
                    <p>{review.notes || 'No notes added.'}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No reviews yet.</p>
            )}
          </div>

          <form className="review-form" onSubmit={handleReviewSubmit}>
            <h3>Submit review</h3>

            <label>
              Score
              <select
                value={reviewForm.score}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, score: event.target.value }))}
              >
                <option value="">Choose a score</option>
                {[1, 2, 3, 4, 5].map((score) => (
                  <option key={score} value={score}>
                    {score} / 5
                  </option>
                ))}
              </select>
            </label>

            <label>
              Notes
              <textarea
                rows="4"
                value={reviewForm.notes}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, notes: event.target.value }))}
                placeholder="Add review notes"
              />
            </label>

            {reviewState.message && <div className={`notice ${reviewState.type}`}>{reviewState.message}</div>}

            <button type="submit" disabled={reviewState.busy}>
              {reviewState.busy ? 'Submitting...' : 'Submit review'}
            </button>
          </form>
        </aside>
      )}
    </section>
  );
}
