import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import mongoose from 'mongoose';
import {
  createTask,
  listTasks,
  reviewTask,
  submitTask,
} from '../src/controllers/tasks.controller.js';
import {
  activitySummary,
  createActivity,
  listActivities,
} from '../src/controllers/activities.controller.js';
import Activity from '../src/models/Activity.js';
import Intern from '../src/models/Intern.js';
import Task from '../src/models/Task.js';
import User from '../src/models/User.js';

const originals = [];

function mock(target, method, replacement) {
  originals.push([target, method, target[method]]);
  target[method] = replacement;
}

afterEach(() => {
  while (originals.length) {
    const [target, method, original] = originals.pop();
    target[method] = original;
  }
});

function id() {
  return new mongoose.Types.ObjectId();
}

async function invoke(handler, request = {}) {
  const req = {
    body: {},
    params: {},
    query: {},
    user: { _id: id(), role: 'admin' },
    ...request,
  };
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
  let error;
  await handler(req, res, (caught) => {
    error = caught;
  });
  return { error, res };
}

function document(values) {
  return {
    async save() {},
    async populate() {},
    ...values,
  };
}

function listQuery(items = []) {
  return {
    populate() { return this; },
    sort() { return this; },
    skip() { return this; },
    limit() { return Promise.resolve(items); },
  };
}

test('createTask assigns the authenticated staff user and returns the populated task', async () => {
  const staffId = id();
  const internId = id();
  let createPayload;
  const created = document({ _id: id(), title: 'Ship the feature' });

  mock(User, 'findOne', async () => ({ _id: internId }));
  mock(Task, 'create', async (payload) => {
    createPayload = payload;
    return created;
  });

  const { error, res } = await invoke(createTask, {
    user: { _id: staffId, role: 'mentor' },
    body: { title: '  Ship the feature  ', assignedTo: String(internId) },
  });

  assert.equal(error, undefined);
  assert.equal(res.statusCode, 201);
  assert.equal(createPayload.title, 'Ship the feature');
  assert.equal(String(createPayload.assignedBy), String(staffId));
  assert.equal(res.body.data, created);
});

test('listTasks always scopes an intern to their own tasks', async () => {
  const internId = id();
  let findFilter;
  let countFilter;

  mock(Task, 'find', (filter) => {
    findFilter = filter;
    return listQuery([{ _id: id() }]);
  });
  mock(Task, 'countDocuments', async (filter) => {
    countFilter = filter;
    return 1;
  });

  const { error, res } = await invoke(listTasks, {
    user: { _id: internId, role: 'intern' },
    query: { assignedTo: String(id()), status: 'todo' },
  });

  assert.equal(error, undefined);
  assert.equal(String(findFilter.assignedTo), String(internId));
  assert.equal(String(countFilter.assignedTo), String(internId));
  assert.equal(findFilter.status, 'todo');
  assert.equal(res.body.data.total, 1);
});

test('submitTask blocks users other than the assignee', async () => {
  const task = document({ assignedTo: id(), status: 'todo' });
  mock(Task, 'findById', async () => task);

  const { error } = await invoke(submitTask, {
    user: { _id: id(), role: 'intern' },
    params: { id: String(id()) },
    body: { submissionUrl: 'https://github.com/example/pull/1' },
  });

  assert.equal(error?.statusCode, 403);
  assert.match(error?.message, /assigned intern/i);
});

test('submitTask records a valid submission and clears old review notes', async () => {
  const internId = id();
  let saved = false;
  const task = document({
    assignedTo: internId,
    status: 'rejected',
    reviewNotes: 'Please retry',
    async save() { saved = true; },
  });
  mock(Task, 'findById', async () => task);

  const { error, res } = await invoke(submitTask, {
    user: { _id: internId, role: 'intern' },
    params: { id: String(id()) },
    body: { submissionUrl: 'https://github.com/example/pull/2' },
  });

  assert.equal(error, undefined);
  assert.equal(saved, true);
  assert.equal(task.status, 'submitted');
  assert.equal(task.reviewNotes, '');
  assert.ok(task.submittedAt instanceof Date);
  assert.equal(res.body.data, task);
});

test('reviewTask only accepts a submitted task', async () => {
  mock(Task, 'findById', async () => document({ status: 'todo' }));

  const { error } = await invoke(reviewTask, {
    params: { id: String(id()) },
    body: { status: 'approved', reviewNotes: 'Looks good' },
  });

  assert.equal(error?.statusCode, 409);
  assert.match(error?.message, /submitted tasks/i);
});

test('createActivity rejects a second check-in on the same UTC date', async () => {
  mock(Activity, 'exists', async () => ({ _id: id() }));

  const { error } = await invoke(createActivity, {
    user: { _id: id(), role: 'intern' },
    body: { type: 'check_in', date: '2026-08-31', summary: 'Started work' },
  });

  assert.equal(error?.statusCode, 409);
  assert.match(error?.message, /already exists/i);
});

test('createActivity validates and stores an intern daily log', async () => {
  const internId = id();
  let createPayload;
  const created = document({ _id: id() });
  mock(Activity, 'create', async (payload) => {
    createPayload = payload;
    return created;
  });

  const { error, res } = await invoke(createActivity, {
    user: { _id: internId, role: 'intern' },
    body: {
      type: 'daily_log',
      date: '2026-08-31',
      hours: '6.5',
      summary: '  Completed the API  ',
      blockers: '  Waiting for review  ',
    },
  });

  assert.equal(error, undefined);
  assert.equal(res.statusCode, 201);
  assert.equal(String(createPayload.intern), String(internId));
  assert.equal(createPayload.hours, 6.5);
  assert.equal(createPayload.summary, 'Completed the API');
  assert.equal(createPayload.blockers, 'Waiting for review');
});

test('listActivities restricts mentors to their assigned interns', async () => {
  const mentorId = id();
  const assignedIntern = id();
  const unassignedIntern = id();
  const internQuery = {
    select() { return this; },
    lean() { return Promise.resolve([{ user: assignedIntern }]); },
  };
  mock(Intern, 'find', () => internQuery);

  const { error } = await invoke(listActivities, {
    user: { _id: mentorId, role: 'mentor' },
    query: { intern: String(unassignedIntern) },
  });

  assert.equal(error?.statusCode, 403);
  assert.match(error?.message, /not assigned/i);
});

test('activitySummary returns totals and per-day heatmap values', async () => {
  const internId = id();
  const internUser = { _id: internId, name: 'Fouad' };
  const userQuery = {
    select() { return Promise.resolve(internUser); },
  };

  mock(Intern, 'findOne', async () => ({ user: internId }));
  mock(User, 'findOne', () => userQuery);
  mock(Activity, 'aggregate', async () => [
    { _id: '2026-08-30', count: 2, hours: 7.5 },
    { _id: '2026-08-31', count: 1, hours: 4 },
  ]);

  const { error, res } = await invoke(activitySummary, {
    user: { _id: id(), role: 'admin' },
    params: { internId: String(internId) },
  });

  assert.equal(error, undefined);
  assert.equal(res.body.data.intern, internUser);
  assert.equal(res.body.data.totalHours, 11.5);
  assert.equal(res.body.data.totalEntries, 3);
  assert.deepEqual(res.body.data.days[1], { date: '2026-08-31', count: 1, hours: 4 });
});
