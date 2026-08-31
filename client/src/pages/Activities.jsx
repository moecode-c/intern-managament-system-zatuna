import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const MOCK_INTERNS = [
  {
    _id: 'mock-record-nour',
    status: 'active',
    user: { _id: 'mock-intern-nour', name: 'Nour Hassan', email: 'nour@elzatuna.local' },
  },
  {
    _id: 'mock-record-yousef',
    status: 'active',
    user: { _id: 'mock-intern-yousef', name: 'Yousef Adel', email: 'yousef@elzatuna.local' },
  },
  {
    _id: 'mock-record-salma',
    status: 'onboarding',
    user: { _id: 'mock-intern-salma', name: 'Salma Tarek', email: 'salma@elzatuna.local' },
  },
  {
    _id: 'mock-record-hana',
    status: 'active',
    user: { _id: 'mock-intern-hana', name: 'Hana Magdy', email: 'hana@elzatuna.local' },
  },
];

const entityId = (entity) => String(entity?._id ?? entity?.id ?? entity ?? '');

const internUser = (intern) => intern?.user || intern;

const displayName = (entity, fallback = 'Unknown intern') =>
  entity?.name || entity?.fullName || entity?.email || fallback;

const responseItems = (response, keys) => {
  const payload = response?.data?.data ?? response?.data;
  if (Array.isArray(payload)) return payload;
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
  }
  return [];
};

const responseItem = (response) => response?.data?.data ?? response?.data ?? null;

const errorMessage = (error, fallback) => error.response?.data?.message || fallback;

const dateInputValue = (value) => {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const daysFromToday = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  date.setHours(10, 0, 0, 0);
  return date;
};

const startOfCurrentWeek = () => {
  const date = new Date();
  date.setDate(date.getDate() - date.getDay());
  date.setHours(0, 0, 0, 0);
  return date;
};

const TODAY = dateInputValue(new Date());
const DEFAULT_FROM = dateInputValue(daysFromToday(-13));

const formatDate = (value) => {
  if (!value) return 'Date unavailable';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Date unavailable';
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const typeLabel = (type) => ({
  check_in: 'Check-in',
  daily_log: 'Daily log',
  note: 'Note',
}[type] || 'Activity');

const isInRange = (activity, filters) => {
  const activityDate = new Date(activity?.date || activity?.createdAt);
  if (Number.isNaN(activityDate.getTime())) return false;
  const from = filters.from ? new Date(`${filters.from}T00:00:00`) : null;
  const to = filters.to ? new Date(`${filters.to}T23:59:59.999`) : null;
  if (from && activityDate < from) return false;
  if (to && activityDate > to) return false;
  if (filters.intern && entityId(activity?.intern) !== filters.intern) return false;
  return true;
};

const sortNewestFirst = (items) => [...items].sort((left, right) => {
  const leftDate = new Date(left?.date || left?.createdAt || 0).getTime();
  const rightDate = new Date(right?.date || right?.createdAt || 0).getTime();
  return rightDate - leftDate;
});

const mockActivitiesFor = (user) => {
  if (user?.role === 'intern') {
    const currentIntern = { ...user, _id: entityId(user) || 'mock-current-intern' };
    return [
      {
        _id: 'mock-log-current-1',
        intern: currentIntern,
        type: 'daily_log',
        date: daysFromToday(-1).toISOString(),
        hours: 6,
        summary: 'Built the responsive task cards and connected the list endpoint.',
        blockers: '',
      },
      {
        _id: 'mock-log-current-2',
        intern: currentIntern,
        type: 'daily_log',
        date: daysFromToday(-2).toISOString(),
        hours: 5.5,
        summary: 'Mapped the API response and handled loading and empty states.',
        blockers: 'Waiting for the activity endpoint to be merged.',
      },
      {
        _id: 'mock-log-current-3',
        intern: currentIntern,
        type: 'check_in',
        date: daysFromToday(-5).toISOString(),
        hours: 4,
        summary: 'Reviewed the project structure and prepared the implementation plan.',
        blockers: '',
      },
    ];
  }

  const [nour, yousef, salma, hana] = MOCK_INTERNS.map(internUser);
  return [
    {
      _id: 'mock-log-nour-1',
      intern: nour,
      type: 'daily_log',
      date: daysFromToday(-1).toISOString(),
      hours: 6,
      summary: 'Finished the login validation and responsive layout.',
      blockers: '',
    },
    {
      _id: 'mock-log-yousef-1',
      intern: yousef,
      type: 'daily_log',
      date: daysFromToday(-2).toISOString(),
      hours: 7,
      summary: 'Added model validation and seed coverage.',
      blockers: 'Needs a quick API review.',
    },
    {
      _id: 'mock-log-salma-1',
      intern: salma,
      type: 'check_in',
      date: daysFromToday(-1).toISOString(),
      hours: 3.5,
      summary: 'Completed the codebase walkthrough and started the date filter.',
      blockers: '',
    },
    {
      _id: 'mock-log-nour-2',
      intern: nour,
      type: 'daily_log',
      date: daysFromToday(-5).toISOString(),
      hours: 5,
      summary: 'Connected the applications list endpoint.',
      blockers: '',
    },
    {
      _id: 'mock-log-hana-old',
      intern: hana,
      type: 'daily_log',
      date: daysFromToday(-9).toISOString(),
      hours: 4,
      summary: 'Set up the local development environment.',
      blockers: '',
    },
  ];
};

const ACTIVITIES_STYLES = `
  .activities-page { display: grid; gap: 1.25rem; }
  .activities-page .module-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .activities-page .module-heading h1 { margin-bottom: .2rem; }
  .activities-page .module-heading p { margin: 0; }
  .activities-page .role-pill { border-radius: 999px; padding: .25rem .6rem; font-size: .75rem; font-weight: 700; white-space: nowrap; color: #bcd3ff; background: #1d3158; text-transform: capitalize; }
  .activities-page .notice { border: 1px solid #35517f; background: #162640; color: #c8dcff; border-radius: 8px; padding: .75rem 1rem; }
  .activities-page .notice.error-notice { border-color: #71383b; background: #311d20; color: #ffb8b8; }
  .activities-page .notice.success-notice { border-color: #2f6f55; background: #183629; color: #b9f3d1; }
  .activities-page .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 1.2rem; }
  .activities-page .panel h2 { margin: 0 0 .75rem; font-size: 1.1rem; }
  .activities-page .top-grid { display: grid; grid-template-columns: minmax(280px, 390px) 1fr; gap: 1rem; align-items: start; }
  .activities-page .filter-form { display: grid; grid-template-columns: repeat(4, minmax(130px, 1fr)); gap: .65rem; align-items: end; }
  .activities-page .filter-field { display: flex; flex-direction: column; gap: .35rem; }
  .activities-page .filter-field label { margin: 0; }
  .activities-page .filter-form button { margin: 0; min-height: 42px; }
  .activities-page .attention-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .6rem; }
  .activities-page .attention-person { border: 1px solid #6f4d2e; background: #302619; border-radius: 8px; padding: .7rem; }
  .activities-page .attention-person strong { display: block; }
  .activities-page .attention-person span { color: #ddbf97; font-size: .8rem; }
  .activities-page .all-clear { color: #9de0ba; margin: 0; }
  .activities-page .timeline-heading { display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: .8rem; }
  .activities-page .timeline-heading h2 { margin: 0; }
  .activities-page .timeline { position: relative; display: grid; gap: .8rem; margin-left: .35rem; padding-left: 1.2rem; }
  .activities-page .timeline::before { content: ''; position: absolute; left: 0; top: .5rem; bottom: .5rem; width: 2px; background: var(--border); }
  .activities-page .activity-card { position: relative; background: #11141a; border: 1px solid var(--border); border-radius: 9px; padding: .9rem; }
  .activities-page .activity-card::before { content: ''; position: absolute; left: -1.58rem; top: 1.05rem; width: .65rem; height: .65rem; border-radius: 50%; background: var(--accent); border: 3px solid var(--bg); }
  .activities-page .activity-card-header { display: flex; justify-content: space-between; align-items: flex-start; gap: .75rem; }
  .activities-page .activity-card-header h3 { margin: 0; font-size: .98rem; }
  .activities-page .activity-card-header time { color: var(--muted); font-size: .78rem; text-align: right; }
  .activities-page .activity-meta { display: flex; gap: .45rem; flex-wrap: wrap; margin-top: .35rem; }
  .activities-page .activity-pill { border-radius: 999px; padding: .2rem .55rem; background: #243044; color: #cbd8ee; font-size: .74rem; }
  .activities-page .activity-summary { margin: .65rem 0 .2rem; overflow-wrap: anywhere; }
  .activities-page .blockers { margin: .5rem 0 0; border-left: 3px solid #d39142; background: #2b241a; color: #f0d3aa; padding: .55rem .65rem; font-size: .84rem; }
  .activities-page .field-error { color: var(--error); font-size: .82rem; margin: .45rem 0 0; }
  .activities-page .empty-state, .activities-page .loading-state { color: var(--muted); text-align: center; padding: 2.5rem 1rem; }
  .activities-page button.secondary { background: #384154; }
  @media (max-width: 760px) {
    .activities-page .module-heading, .activities-page .timeline-heading { align-items: flex-start; flex-direction: column; }
    .activities-page .top-grid { grid-template-columns: 1fr; }
    .activities-page .filter-form { grid-template-columns: 1fr; }
    .activities-page .activity-card-header { flex-direction: column; }
    .activities-page .activity-card-header time { text-align: left; }
  }
`;

export default function Activities() {
  const { user } = useAuth();
  const isStaff = ['admin', 'mentor'].includes(user?.role);
  const initialFilters = { from: DEFAULT_FROM, to: TODAY, intern: '' };
  const [activities, setActivities] = useState([]);
  const [weekActivities, setWeekActivities] = useState([]);
  const [interns, setInterns] = useState([]);
  const [filters, setFilters] = useState(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState(initialFilters);
  const [loading, setLoading] = useState(true);
  const [usingMocks, setUsingMocks] = useState(false);
  const [internsUnavailable, setInternsUnavailable] = useState(false);
  const [pageError, setPageError] = useState('');
  const [filterError, setFilterError] = useState('');
  const [form, setForm] = useState({ date: TODAY, hours: '', summary: '', blockers: '' });
  const [formBusy, setFormBusy] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const loadActivities = useCallback(async () => {
    setLoading(true);
    setPageError('');
    setUsingMocks(false);
    setInternsUnavailable(false);

    const displayParams = {
      from: appliedFilters.from,
      to: appliedFilters.to,
      ...(isStaff && appliedFilters.intern ? { intern: appliedFilters.intern } : {}),
    };
    const weekFilters = {
      from: dateInputValue(startOfCurrentWeek()),
      to: TODAY,
      intern: '',
    };

    const [activityResult, internResult, weekResult] = await Promise.allSettled([
      api.get('/activities', { params: displayParams }),
      isStaff ? api.get('/interns') : Promise.resolve(null),
      isStaff
        ? api.get('/activities', { params: { from: weekFilters.from, to: weekFilters.to } })
        : Promise.resolve(null),
    ]);
    const errors = [];
    const activitiesAreMocked = activityResult.status === 'rejected'
      && activityResult.reason?.response?.status === 501;
    const mockActivities = activitiesAreMocked ? mockActivitiesFor(user) : [];

    if (activityResult.status === 'fulfilled') {
      setActivities(sortNewestFirst(responseItems(activityResult.value, ['items', 'activities'])));
    } else if (activitiesAreMocked) {
      setActivities(sortNewestFirst(mockActivities.filter((activity) => isInRange(activity, appliedFilters))));
      setUsingMocks(true);
    } else {
      setActivities([]);
      errors.push(errorMessage(activityResult.reason, 'Could not load activity logs. Please try again.'));
    }

    if (isStaff && internResult.status === 'fulfilled') {
      setInterns(responseItems(internResult.value, ['items', 'interns']));
    } else if (isStaff && internResult.reason?.response?.status === 501) {
      if (activitiesAreMocked) {
        setInterns(MOCK_INTERNS);
      } else {
        setInterns([]);
        setInternsUnavailable(true);
      }
    } else if (isStaff && internResult.status === 'rejected') {
      setInterns([]);
      errors.push(errorMessage(internResult.reason, 'Could not load the intern list.'));
    } else {
      setInterns([]);
    }

    if (isStaff && weekResult.status === 'fulfilled') {
      setWeekActivities(responseItems(weekResult.value, ['items', 'activities']));
    } else if (isStaff && activitiesAreMocked) {
      setWeekActivities(mockActivities.filter((activity) => isInRange(activity, weekFilters)));
    } else if (isStaff && weekResult.status === 'rejected') {
      setWeekActivities([]);
      errors.push(errorMessage(weekResult.reason, 'Could not load this week\'s activity.'));
    } else {
      setWeekActivities([]);
    }

    setPageError(errors.join(' '));
    setLoading(false);
  }, [appliedFilters, isStaff, user]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const missingThisWeek = useMemo(() => {
    if (!isStaff) return [];
    const loggedInternIds = new Set(weekActivities.map((activity) => entityId(activity?.intern)));
    return interns.filter((intern) => {
      const status = intern?.status;
      const isCurrent = !status || ['active', 'onboarding'].includes(status);
      return isCurrent && !loggedInternIds.has(entityId(internUser(intern)));
    });
  }, [interns, isStaff, weekActivities]);

  const applyFilters = (event) => {
    event.preventDefault();
    setFilterError('');
    setSuccessMessage('');
    if (filters.from && filters.to && filters.from > filters.to) {
      setFilterError('The start date must be on or before the end date.');
      return;
    }
    setAppliedFilters({ ...filters });
  };

  const createLog = async (event) => {
    event.preventDefault();
    setFormError('');
    setSuccessMessage('');
    setFormBusy(true);
    const payload = {
      type: 'daily_log',
      date: form.date,
      hours: Number(form.hours),
      summary: form.summary.trim(),
      blockers: form.blockers.trim(),
    };

    try {
      let createdActivity;
      if (usingMocks) {
        createdActivity = {
          ...payload,
          _id: `mock-log-${Date.now()}`,
          intern: user,
          createdAt: new Date().toISOString(),
        };
      } else {
        const response = await api.post('/activities', payload);
        createdActivity = responseItem(response);
      }

      if (!createdActivity) throw new Error('The server returned an empty activity.');
      const completeActivity = {
        ...createdActivity,
        intern:
          createdActivity.intern && typeof createdActivity.intern === 'object'
            ? createdActivity.intern
            : user,
      };
      if (isInRange(completeActivity, appliedFilters)) {
        setActivities((current) => sortNewestFirst([completeActivity, ...current]));
      }
      setForm({ date: form.date, hours: '', summary: '', blockers: '' });
      setSuccessMessage('Activity log saved.');
    } catch (error) {
      if (error.response?.status === 501) {
        const createdActivity = {
          ...payload,
          _id: `mock-log-${Date.now()}`,
          intern: user,
          createdAt: new Date().toISOString(),
        };
        setUsingMocks(true);
        if (isInRange(createdActivity, appliedFilters)) {
          setActivities((current) => sortNewestFirst([createdActivity, ...current]));
        }
        setForm({ date: form.date, hours: '', summary: '', blockers: '' });
        setSuccessMessage('Activity log saved in demo mode.');
      } else {
        setFormError(errorMessage(error, 'Could not save your activity log.'));
      }
    } finally {
      setFormBusy(false);
    }
  };

  return (
    <section className="activities-page">
      <style>{ACTIVITIES_STYLES}</style>

      <header className="module-heading">
        <div>
          <h1>Activities</h1>
          <p className="muted">
            {isStaff
              ? 'Review intern logs and spot missing weekly updates.'
              : 'Record your daily progress, hours, and blockers.'}
          </p>
        </div>
        <span className="role-pill">{user?.role || 'user'} view</span>
      </header>

      {usingMocks && (
        <div className="notice" role="status">
          Showing demo data while the activity and intern APIs are being completed. Forms and filters still work locally.
        </div>
      )}
      {internsUnavailable && (
        <div className="notice" role="status">
          Real activity is loaded. Intern filters and attendance alerts are unavailable until the intern-list module is completed.
        </div>
      )}
      {successMessage && <div className="notice success-notice" role="status">{successMessage}</div>}
      {pageError && (
        <div className="notice error-notice" role="alert">
          {pageError}{' '}
          <button className="secondary" type="button" onClick={loadActivities}>Try again</button>
        </div>
      )}

      {!isStaff && (
        <section className="panel" aria-labelledby="daily-log-heading">
          <h2 id="daily-log-heading">Add today&apos;s log</h2>
          <form onSubmit={createLog}>
            <label htmlFor="activity-date">Date</label>
            <input
              id="activity-date"
              type="date"
              max={TODAY}
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              disabled={formBusy}
              required
            />

            <label htmlFor="activity-hours">Hours</label>
            <input
              id="activity-hours"
              type="number"
              min="0.25"
              max="24"
              step="0.25"
              placeholder="6.5"
              value={form.hours}
              onChange={(event) => setForm((current) => ({ ...current, hours: event.target.value }))}
              disabled={formBusy}
              required
            />

            <label htmlFor="activity-summary">What did you work on?</label>
            <textarea
              id="activity-summary"
              rows="4"
              placeholder="Summarize the progress you made today"
              value={form.summary}
              onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
              disabled={formBusy}
              required
            />

            <label htmlFor="activity-blockers">Blockers</label>
            <textarea
              id="activity-blockers"
              rows="3"
              placeholder="Leave blank if you are not blocked"
              value={form.blockers}
              onChange={(event) => setForm((current) => ({ ...current, blockers: event.target.value }))}
              disabled={formBusy}
            />

            {formError && <p className="field-error">{formError}</p>}
            <button type="submit" disabled={formBusy}>
              {formBusy ? 'Saving...' : 'Save daily log'}
            </button>
          </form>
        </section>
      )}

      {isStaff && (
        <section className="panel" aria-labelledby="attention-heading">
          <h2 id="attention-heading">Needs attention this week</h2>
          {internsUnavailable ? (
            <p className="muted">Intern attendance cannot be calculated without the intern list.</p>
          ) : missingThisWeek.length === 0 ? (
            <p className="all-clear">Everyone has logged activity this week.</p>
          ) : (
            <div className="attention-list">
              {missingThisWeek.map((intern) => {
                const userRecord = internUser(intern);
                return (
                  <div className="attention-person" key={entityId(userRecord)}>
                    <strong>{displayName(userRecord)}</strong>
                    <span>No activity logged this week</span>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      <section className="panel" aria-labelledby="activity-filter-heading">
        <h2 id="activity-filter-heading">Filter the timeline</h2>
        <form className="filter-form" onSubmit={applyFilters}>
          <div className="filter-field">
            <label htmlFor="activity-from">From</label>
            <input
              id="activity-from"
              type="date"
              value={filters.from}
              onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
            />
          </div>
          <div className="filter-field">
            <label htmlFor="activity-to">To</label>
            <input
              id="activity-to"
              type="date"
              value={filters.to}
              onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
            />
          </div>
          {isStaff && (
            <div className="filter-field">
              <label htmlFor="activity-intern">Intern</label>
              <select
                id="activity-intern"
                value={filters.intern}
                onChange={(event) => setFilters((current) => ({ ...current, intern: event.target.value }))}
                disabled={internsUnavailable}
              >
                <option value="">All interns</option>
                {interns.map((intern) => {
                  const userRecord = internUser(intern);
                  return (
                    <option key={entityId(userRecord)} value={entityId(userRecord)}>
                      {displayName(userRecord)}
                    </option>
                  );
                })}
              </select>
            </div>
          )}
          <button type="submit" disabled={loading}>{loading ? 'Loading...' : 'Apply filters'}</button>
        </form>
        {filterError && <p className="field-error">{filterError}</p>}
      </section>

      <section className="panel" aria-labelledby="activity-timeline-heading">
        <div className="timeline-heading">
          <h2 id="activity-timeline-heading">{isStaff ? 'Intern activity' : 'My activity'}</h2>
          <span className="muted">
            {activities.length} {activities.length === 1 ? 'log' : 'logs'}
          </span>
        </div>

        {loading ? (
          <div className="loading-state">Loading activity logs...</div>
        ) : activities.length === 0 ? (
          <div className="empty-state">No activity logs yet</div>
        ) : (
          <div className="timeline">
            {activities.map((activity) => (
              <article className="activity-card" key={entityId(activity) || `${activity?.date}-${activity?.summary}`}>
                <div className="activity-card-header">
                  <h3>{isStaff ? displayName(activity?.intern) : typeLabel(activity?.type)}</h3>
                  <time dateTime={activity?.date || activity?.createdAt}>
                    {formatDate(activity?.date || activity?.createdAt)}
                  </time>
                </div>
                <div className="activity-meta">
                  {isStaff && <span className="activity-pill">{typeLabel(activity?.type)}</span>}
                  <span className="activity-pill">
                    {Number.isFinite(Number(activity?.hours)) ? `${Number(activity.hours)} hours` : 'Hours not recorded'}
                  </span>
                </div>
                <p className="activity-summary">{activity?.summary || 'No summary provided.'}</p>
                {activity?.blockers && (
                  <p className="blockers"><strong>Blockers:</strong> {activity.blockers}</p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}
