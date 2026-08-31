import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';

const TASK_STATUSES = ['todo', 'in_progress', 'submitted', 'approved', 'rejected'];

const STATUS_LABELS = {
  todo: 'To do',
  in_progress: 'In progress',
  submitted: 'Submitted',
  approved: 'Approved',
  rejected: 'Rejected',
};

const MOCK_INTERNS = [
  { _id: 'mock-intern-nour', name: 'Nour Hassan', email: 'nour@elzatuna.local' },
  { _id: 'mock-intern-yousef', name: 'Yousef Adel', email: 'yousef@elzatuna.local' },
  { _id: 'mock-intern-salma', name: 'Salma Tarek', email: 'salma@elzatuna.local' },
  { _id: 'mock-intern-hana', name: 'Hana Magdy', email: 'hana@elzatuna.local' },
];

const dateFromToday = (offset) => {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString();
};

const entityId = (entity) => String(entity?._id ?? entity?.id ?? entity ?? '');

const displayName = (entity, fallback = 'Unknown intern') =>
  entity?.name || entity?.fullName || entity?.email || fallback;

const internUser = (intern) => intern?.user || intern;

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

const formatDate = (value) => {
  if (!value) return 'No due date';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No due date';
  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
};

const isOverdue = (task) => {
  if (!task?.dueDate || task.status === 'approved') return false;
  const dueDate = new Date(task.dueDate);
  if (Number.isNaN(dueDate.getTime())) return false;
  dueDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
};

const isWebUrl = (value) => {
  try {
    const url = new URL(value);
    return ['http:', 'https:'].includes(url.protocol);
  } catch {
    return false;
  }
};

const mockTasksFor = (user) => {
  const currentIntern = user?.role === 'intern'
    ? { ...user, _id: entityId(user) || 'mock-current-intern' }
    : MOCK_INTERNS[0];

  return [
    {
      _id: 'mock-task-login',
      title: 'Build the login screen',
      description: 'Follow the approved responsive layout and include inline validation.',
      assignedTo: currentIntern,
      dueDate: dateFromToday(3),
      status: 'in_progress',
    },
    {
      _id: 'mock-task-table',
      title: 'Write the applications table',
      description: 'Use the existing list endpoint and cover the empty state.',
      assignedTo: currentIntern,
      dueDate: dateFromToday(1),
      status: 'submitted',
      submissionUrl: 'https://github.com/example/pull/12',
      submittedAt: dateFromToday(-1),
    },
    {
      _id: 'mock-task-docs',
      title: 'Document the API endpoints',
      description: 'Add request and response examples for each endpoint.',
      assignedTo: currentIntern,
      dueDate: dateFromToday(-2),
      status: 'todo',
    },
    ...(user?.role === 'intern'
      ? []
      : [
          {
            _id: 'mock-task-models',
            title: 'Set up the Mongoose models',
            assignedTo: MOCK_INTERNS[1],
            dueDate: dateFromToday(-4),
            status: 'approved',
            submissionUrl: 'https://github.com/example/pull/9',
            reviewNotes: 'Clean work and good validation coverage.',
          },
          {
            _id: 'mock-task-filter',
            title: 'Fix the date filter bug',
            assignedTo: MOCK_INTERNS[2],
            dueDate: dateFromToday(-1),
            status: 'rejected',
            submissionUrl: 'https://github.com/example/pull/10',
            reviewNotes: 'Please include the end date in the query.',
          },
        ]),
  ];
};

const mergeTask = (previous, next) => ({
  ...previous,
  ...next,
  assignedTo:
    next?.assignedTo && typeof next.assignedTo === 'object'
      ? next.assignedTo
      : previous.assignedTo,
  assignedBy:
    next?.assignedBy && typeof next.assignedBy === 'object'
      ? next.assignedBy
      : previous.assignedBy,
});

const TASK_STYLES = `
  .tasks-page { display: grid; gap: 1.25rem; }
  .tasks-page .module-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
  .tasks-page .module-heading h1 { margin-bottom: .2rem; }
  .tasks-page .module-heading p { margin: 0; }
  .tasks-page .role-pill, .tasks-page .status-pill, .tasks-page .overdue-pill {
    border-radius: 999px; padding: .25rem .6rem; font-size: .75rem; font-weight: 700; white-space: nowrap;
  }
  .tasks-page .role-pill { color: #bcd3ff; background: #1d3158; text-transform: capitalize; }
  .tasks-page .notice { border: 1px solid #35517f; background: #162640; color: #c8dcff; border-radius: 8px; padding: .75rem 1rem; }
  .tasks-page .notice.error-notice { border-color: #71383b; background: #311d20; color: #ffb8b8; }
  .tasks-page .assignment-panel { display: grid; grid-template-columns: minmax(260px, 380px) 1fr; gap: 1rem; align-items: start; }
  .tasks-page .panel { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: 1.2rem; }
  .tasks-page .panel h2 { margin: 0 0 .75rem; font-size: 1.1rem; }
  .tasks-page .task-summary { display: grid; grid-template-columns: repeat(5, minmax(90px, 1fr)); gap: .65rem; }
  .tasks-page .summary-item { background: #11141a; border: 1px solid var(--border); border-radius: 8px; padding: .75rem; }
  .tasks-page .summary-item strong { display: block; font-size: 1.3rem; }
  .tasks-page .summary-item span { color: var(--muted); font-size: .78rem; }
  .tasks-page .board-heading { display: flex; align-items: center; justify-content: space-between; gap: 1rem; margin-bottom: .75rem; }
  .tasks-page .board-heading h2 { margin: 0; font-size: 1.15rem; }
  .tasks-page .status-grid { display: grid; grid-template-columns: repeat(5, minmax(230px, 1fr)); gap: .85rem; overflow-x: auto; padding-bottom: .35rem; }
  .tasks-page .status-column { min-width: 0; background: #11141a; border: 1px solid var(--border); border-radius: 10px; padding: .75rem; }
  .tasks-page .column-heading { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-bottom: .7rem; }
  .tasks-page .column-heading h3 { margin: 0; font-size: .95rem; }
  .tasks-page .column-count { color: var(--muted); font-size: .8rem; }
  .tasks-page .task-list { display: grid; gap: .7rem; }
  .tasks-page .task-card { background: var(--panel); border: 1px solid var(--border); border-radius: 8px; padding: .85rem; }
  .tasks-page .task-card.is-overdue { border-color: #9e4a4f; box-shadow: inset 3px 0 #ff6b6b; }
  .tasks-page .task-title-row { display: flex; align-items: flex-start; justify-content: space-between; gap: .5rem; }
  .tasks-page .task-title-row h4 { margin: 0; font-size: .95rem; overflow-wrap: anywhere; }
  .tasks-page .task-description { color: var(--muted); font-size: .84rem; margin: .5rem 0; overflow-wrap: anywhere; }
  .tasks-page .task-meta { display: grid; gap: .2rem; color: var(--muted); font-size: .78rem; }
  .tasks-page .status-pill { background: #243044; color: #cbd8ee; }
  .tasks-page .overdue-pill { background: #4a2226; color: #ffb4b4; }
  .tasks-page .submission-link { display: inline-block; margin-top: .55rem; font-size: .82rem; overflow-wrap: anywhere; }
  .tasks-page .review-notes { margin: .6rem 0 0; padding: .55rem; background: #11141a; border-radius: 6px; font-size: .8rem; }
  .tasks-page .inline-form { border-top: 1px solid var(--border); margin-top: .7rem; padding-top: .65rem; }
  .tasks-page .inline-form label { margin-top: 0; }
  .tasks-page .task-actions { display: flex; gap: .5rem; flex-wrap: wrap; margin-top: .55rem; }
  .tasks-page .task-actions button { margin: 0; flex: 1; min-width: 90px; padding: .5rem .7rem; font-size: .82rem; }
  .tasks-page button.secondary { background: #384154; }
  .tasks-page button.reject { background: #8c3940; }
  .tasks-page .empty-state { text-align: center; color: var(--muted); padding: 2.5rem 1rem; }
  .tasks-page .empty-column { color: var(--muted); font-size: .82rem; margin: .3rem 0; }
  .tasks-page .field-error { color: var(--error); font-size: .8rem; margin: .4rem 0 0; }
  .tasks-page .loading-state { text-align: center; color: var(--muted); }
  @media (max-width: 760px) {
    .tasks-page .module-heading, .tasks-page .board-heading { align-items: flex-start; flex-direction: column; }
    .tasks-page .assignment-panel { grid-template-columns: 1fr; }
    .tasks-page .task-summary { grid-template-columns: repeat(2, 1fr); }
    .tasks-page .status-grid { grid-template-columns: 1fr; overflow: visible; }
    .tasks-page .status-column { width: 100%; }
  }
`;

export default function Tasks() {
  const { user } = useAuth();
  const isStaff = ['admin', 'mentor'].includes(user?.role);
  const [tasks, setTasks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [usingMocks, setUsingMocks] = useState(false);
  const [internsUnavailable, setInternsUnavailable] = useState(false);
  const [assignment, setAssignment] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
  });
  const [assignmentBusy, setAssignmentBusy] = useState(false);
  const [assignmentError, setAssignmentError] = useState('');
  const [submissionUrls, setSubmissionUrls] = useState({});
  const [reviewNotes, setReviewNotes] = useState({});
  const [actionBusy, setActionBusy] = useState('');
  const [actionErrors, setActionErrors] = useState({});

  const loadData = useCallback(async () => {
    setLoading(true);
    setPageError('');
    setUsingMocks(false);
    setInternsUnavailable(false);

    const [taskResult, internResult] = await Promise.allSettled([
      api.get('/tasks'),
      isStaff ? api.get('/interns') : Promise.resolve(null),
    ]);
    const errors = [];
    const tasksAreMocked = taskResult.status === 'rejected'
      && taskResult.reason?.response?.status === 501;

    if (taskResult.status === 'fulfilled') {
      setTasks(responseItems(taskResult.value, ['items', 'tasks']));
    } else if (tasksAreMocked) {
      setTasks(mockTasksFor(user));
      setUsingMocks(true);
    } else {
      setTasks([]);
      errors.push(errorMessage(taskResult.reason, 'Could not load tasks. Please try again.'));
    }

    if (isStaff && internResult.status === 'fulfilled') {
      setInterns(responseItems(internResult.value, ['items', 'interns']));
    } else if (isStaff && internResult.reason?.response?.status === 501) {
      if (tasksAreMocked) {
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

    setPageError(errors.join(' '));
    setLoading(false);
  }, [isStaff, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tasksByStatus = useMemo(
    () => Object.fromEntries(
      TASK_STATUSES.map((status) => [
        status,
        tasks.filter((task) => (task?.status || 'todo') === status),
      ])
    ),
    [tasks]
  );

  const replaceTask = (taskId, updatedTask) => {
    setTasks((current) => current.map((task) =>
      entityId(task) === taskId ? mergeTask(task, updatedTask) : task
    ));
  };

  const createAssignment = async (event) => {
    event.preventDefault();
    setAssignmentError('');
    setAssignmentBusy(true);

    const selectedIntern = interns.find(
      (intern) => entityId(internUser(intern)) === assignment.assignedTo
    );
    const payload = {
      title: assignment.title.trim(),
      description: assignment.description.trim(),
      assignedTo: assignment.assignedTo,
      ...(assignment.dueDate ? { dueDate: assignment.dueDate } : {}),
    };

    try {
      let createdTask;
      if (usingMocks) {
        createdTask = {
          ...payload,
          _id: `mock-task-${Date.now()}`,
          assignedTo: internUser(selectedIntern),
          assignedBy: user,
          status: 'todo',
          createdAt: new Date().toISOString(),
        };
      } else {
        const response = await api.post('/tasks', payload);
        createdTask = responseItem(response);
      }

      if (!createdTask) throw new Error('The server returned an empty task.');
      setTasks((current) => [
        {
          ...createdTask,
          assignedTo:
            createdTask.assignedTo && typeof createdTask.assignedTo === 'object'
              ? createdTask.assignedTo
              : internUser(selectedIntern),
        },
        ...current,
      ]);
      setAssignment({ title: '', description: '', assignedTo: '', dueDate: '' });
    } catch (error) {
      if (error.response?.status === 501) {
        setUsingMocks(true);
        setTasks((current) => [
          {
            ...payload,
            _id: `mock-task-${Date.now()}`,
            assignedTo: internUser(selectedIntern),
            assignedBy: user,
            status: 'todo',
          },
          ...current,
        ]);
        setAssignment({ title: '', description: '', assignedTo: '', dueDate: '' });
      } else {
        setAssignmentError(errorMessage(error, 'Could not assign this task.'));
      }
    } finally {
      setAssignmentBusy(false);
    }
  };

  const submitTask = async (event, task) => {
    event.preventDefault();
    const taskId = entityId(task);
    const submissionUrl = (submissionUrls[taskId] || '').trim();
    setActionErrors((current) => ({ ...current, [taskId]: '' }));
    setActionBusy(taskId);

    try {
      let updatedTask;
      if (usingMocks) {
        updatedTask = {
          status: 'submitted',
          submissionUrl,
          submittedAt: new Date().toISOString(),
          reviewNotes: '',
        };
      } else {
        const response = await api.patch(`/tasks/${taskId}/submit`, { submissionUrl });
        updatedTask = responseItem(response);
      }
      replaceTask(taskId, updatedTask || {});
      setSubmissionUrls((current) => ({ ...current, [taskId]: '' }));
    } catch (error) {
      if (error.response?.status === 501) {
        setUsingMocks(true);
        replaceTask(taskId, {
          status: 'submitted',
          submissionUrl,
          submittedAt: new Date().toISOString(),
          reviewNotes: '',
        });
      } else {
        setActionErrors((current) => ({
          ...current,
          [taskId]: errorMessage(error, 'Could not submit this task.'),
        }));
      }
    } finally {
      setActionBusy('');
    }
  };

  const reviewTask = async (task, status) => {
    const taskId = entityId(task);
    const payload = { status, reviewNotes: (reviewNotes[taskId] || '').trim() };
    setActionErrors((current) => ({ ...current, [taskId]: '' }));
    setActionBusy(taskId);

    try {
      let updatedTask;
      if (usingMocks) {
        updatedTask = payload;
      } else {
        const response = await api.patch(`/tasks/${taskId}/review`, payload);
        updatedTask = responseItem(response);
      }
      replaceTask(taskId, updatedTask || payload);
      setReviewNotes((current) => ({ ...current, [taskId]: '' }));
    } catch (error) {
      if (error.response?.status === 501) {
        setUsingMocks(true);
        replaceTask(taskId, payload);
      } else {
        setActionErrors((current) => ({
          ...current,
          [taskId]: errorMessage(error, 'Could not review this task.'),
        }));
      }
    } finally {
      setActionBusy('');
    }
  };

  const renderTask = (task) => {
    const taskId = entityId(task);
    const status = task?.status || 'todo';
    const overdue = isOverdue(task);
    const canSubmit = !isStaff && ['todo', 'in_progress', 'rejected'].includes(status);

    return (
      <article className={`task-card${overdue ? ' is-overdue' : ''}`} key={taskId || task.title}>
        <div className="task-title-row">
          <h4>{task?.title || 'Untitled task'}</h4>
          {overdue && <span className="overdue-pill">Overdue</span>}
        </div>
        <p className="task-description">{task?.description || 'No description provided.'}</p>
        <div className="task-meta">
          {isStaff && <span>Assigned to: {displayName(task?.assignedTo)}</span>}
          <span>Due: {formatDate(task?.dueDate)}</span>
        </div>

        {task?.submissionUrl && (
          isWebUrl(task.submissionUrl) ? (
            <a className="submission-link" href={task.submissionUrl} target="_blank" rel="noreferrer">
              View submission
            </a>
          ) : (
            <p className="task-description">Submission: {task.submissionUrl}</p>
          )
        )}

        {task?.reviewNotes && (
          <p className="review-notes"><strong>Review:</strong> {task.reviewNotes}</p>
        )}

        {canSubmit && (
          <form className="inline-form" onSubmit={(event) => submitTask(event, task)}>
            <label htmlFor={`submission-${taskId}`}>Submission URL</label>
            <input
              id={`submission-${taskId}`}
              type="url"
              placeholder="https://github.com/.../pull/123"
              value={submissionUrls[taskId] || ''}
              onChange={(event) => setSubmissionUrls((current) => ({
                ...current,
                [taskId]: event.target.value,
              }))}
              disabled={actionBusy === taskId}
              required
            />
            {actionErrors[taskId] && <p className="field-error">{actionErrors[taskId]}</p>}
            <button type="submit" disabled={actionBusy === taskId}>
              {actionBusy === taskId ? 'Submitting...' : status === 'rejected' ? 'Resubmit task' : 'Submit task'}
            </button>
          </form>
        )}

        {isStaff && status === 'submitted' && (
          <div className="inline-form">
            <label htmlFor={`review-${taskId}`}>Review notes</label>
            <textarea
              id={`review-${taskId}`}
              rows="3"
              placeholder="Share clear, actionable feedback"
              value={reviewNotes[taskId] || ''}
              onChange={(event) => setReviewNotes((current) => ({
                ...current,
                [taskId]: event.target.value,
              }))}
              disabled={actionBusy === taskId}
            />
            {actionErrors[taskId] && <p className="field-error">{actionErrors[taskId]}</p>}
            <div className="task-actions">
              <button type="button" onClick={() => reviewTask(task, 'approved')} disabled={actionBusy === taskId}>
                {actionBusy === taskId ? 'Saving...' : 'Approve'}
              </button>
              <button className="reject" type="button" onClick={() => reviewTask(task, 'rejected')} disabled={actionBusy === taskId}>
                Reject
              </button>
            </div>
          </div>
        )}
      </article>
    );
  };

  return (
    <section className="tasks-page">
      <style>{TASK_STYLES}</style>

      <header className="module-heading">
        <div>
          <h1>Tasks</h1>
          <p className="muted">
            {isStaff ? 'Assign work and review intern submissions.' : 'Track your work and submit it for review.'}
          </p>
        </div>
        <span className="role-pill">{user?.role || 'user'} view</span>
      </header>

      {usingMocks && (
        <div className="notice" role="status">
          Showing demo data while the task and intern APIs are being completed. Your forms still work locally.
        </div>
      )}
      {internsUnavailable && (
        <div className="notice" role="status">
          Real tasks are loaded. Assigning new work is disabled until the intern-list module is completed.
        </div>
      )}
      {pageError && (
        <div className="notice error-notice" role="alert">
          {pageError}{' '}
          <button className="secondary" type="button" onClick={loadData}>Try again</button>
        </div>
      )}

      {loading ? (
        <div className="panel loading-state">Loading tasks...</div>
      ) : (
        <>
          {isStaff && (
            <div className="assignment-panel">
              <section className="panel" aria-labelledby="assign-task-heading">
                <h2 id="assign-task-heading">Assign a task</h2>
                <form onSubmit={createAssignment}>
                  <label htmlFor="task-title">Title</label>
                  <input
                    id="task-title"
                    value={assignment.title}
                    onChange={(event) => setAssignment((current) => ({ ...current, title: event.target.value }))}
                    disabled={assignmentBusy}
                    required
                  />

                  <label htmlFor="task-description">Description</label>
                  <textarea
                    id="task-description"
                    rows="4"
                    value={assignment.description}
                    onChange={(event) => setAssignment((current) => ({ ...current, description: event.target.value }))}
                    disabled={assignmentBusy}
                  />

                  <label htmlFor="task-intern">Intern</label>
                  <select
                    id="task-intern"
                    value={assignment.assignedTo}
                    onChange={(event) => setAssignment((current) => ({ ...current, assignedTo: event.target.value }))}
                    disabled={assignmentBusy || internsUnavailable}
                    required
                  >
                    <option value="">Choose an intern</option>
                    {interns.map((intern) => {
                      const internRecord = internUser(intern);
                      return (
                        <option key={entityId(internRecord)} value={entityId(internRecord)}>
                          {displayName(internRecord)}
                        </option>
                      );
                    })}
                  </select>

                  <label htmlFor="task-due-date">Due date</label>
                  <input
                    id="task-due-date"
                    type="date"
                    value={assignment.dueDate}
                    onChange={(event) => setAssignment((current) => ({ ...current, dueDate: event.target.value }))}
                    disabled={assignmentBusy}
                  />

                  {assignmentError && <p className="field-error">{assignmentError}</p>}
                  <button type="submit" disabled={assignmentBusy || interns.length === 0}>
                    {assignmentBusy ? 'Assigning...' : 'Assign task'}
                  </button>
                </form>
              </section>

              <section className="panel" aria-labelledby="task-summary-heading">
                <h2 id="task-summary-heading">At a glance</h2>
                <div className="task-summary">
                  {TASK_STATUSES.map((status) => (
                    <div className="summary-item" key={status}>
                      <strong>{tasksByStatus[status].length}</strong>
                      <span>{STATUS_LABELS[status]}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          )}

          <section className="panel" aria-labelledby="task-board-heading">
            <div className="board-heading">
              <h2 id="task-board-heading">{isStaff ? 'All tasks' : 'My tasks'}</h2>
              <span className="muted">{tasks.length} {tasks.length === 1 ? 'task' : 'tasks'}</span>
            </div>

            {tasks.length === 0 ? (
              <div className="empty-state">No tasks assigned yet</div>
            ) : (
              <div className="status-grid">
                {TASK_STATUSES.map((status) => (
                  <section className="status-column" key={status} aria-labelledby={`status-${status}`}>
                    <div className="column-heading">
                      <h3 id={`status-${status}`}>{STATUS_LABELS[status]}</h3>
                      <span className="column-count">{tasksByStatus[status].length}</span>
                    </div>
                    <div className="task-list">
                      {tasksByStatus[status].length > 0
                        ? tasksByStatus[status].map(renderTask)
                        : <p className="empty-column">Nothing here yet.</p>}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </section>
  );
}
