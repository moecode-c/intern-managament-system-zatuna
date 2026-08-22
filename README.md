# El Zatuna - Intern Management System

Internal system for managing the El Zatuna internship programme: public applications,
applicant tracking, intern onboarding, activity logging and role-based dashboards.

**Stack:** MongoDB · Express · React · Node (MERN), npm workspaces monorepo.

---

## Getting started

You need **Node 20+** and a **MongoDB** instance (local `mongod`, or a free MongoDB Atlas cluster).

```bash
git clone <repo-url>
cd intern-managament-system-zatuna
npm install
cp .env.example .env      # then edit .env - set MONGO_URI and JWT_SECRET
npm run seed              # fills the database with a full local dataset
npm run dev               # API on :5000, client on :5173
```

Open http://localhost:5173.

### Seeded accounts

`npm run seed` creates one account per role so you can develop against all three
without hand-editing the database. They all share the `SEED_ADMIN_PASSWORD` from
your `.env` (default `Admin123!`).

| Role | Email |
|---|---|
| admin | the `SEED_ADMIN_EMAIL` from your `.env` |
| mentor | `sara.mentor@elzatuna.local` |
| mentor | `karim.mentor@elzatuna.local` |
| intern | `nour@elzatuna.local`, `yousef@`, `salma@`, `hana@` |

The seed also inserts 6 applications spanning every stage, 4 interns across two
cohorts with partly-completed checklists, 7 tasks covering every status
(including one overdue), and 35 activity logs over the last fortnight — with one
intern deliberately missing this week's check-ins so the "needs attention" views
have something to show.

Re-running `npm run seed` on a populated database does nothing. Use
`npm run seed:fresh` to wipe and rebuild.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Runs API and client together |
| `npm run dev:server` | API only, with nodemon reload |
| `npm run dev:client` | Vite dev server only |
| `npm run seed` | Seeds the full local dataset (no-op if already seeded) |
| `npm run seed:fresh` | Wipes every collection, then reseeds |
| `npm run build` | Production build of the client |

---

## Layout

```
server/src/
  config/       env loading + mongo connection
  models/       User, Application, Intern, Task, Activity  (all defined)
  middleware/   auth (protect/authorize), error, validate, upload
  routes/       one file per module, mounted in routes/index.js
  controllers/  one file per module  <- most of your work lives here
  utils/        ApiError, asyncHandler, token, notImplemented
  seed.js

client/src/
  api/client.js       axios instance, attaches the JWT
  context/            AuthContext (login/register/logout/me)
  components/         Layout, ProtectedRoute, ModulePlaceholder
  pages/              one file per screen
```

## How it fits together

- **Auth is done.** Register, login, `/me`, JWT signing, password hashing, and the
  `protect` / `authorize(...roles)` middleware all work. Do not rebuild them.
- **Roles** are `admin`, `mentor`, `intern`. Registration always creates an `intern`;
  an admin promotes people afterwards.
- **Every response** uses the same envelope: `{ success, data }` or `{ success, message }`.
  Keep it that way so the client stays predictable.
- **Errors:** throw `new ApiError(status, message)` inside an `asyncHandler`. The error
  middleware formats it. Never `res.status(500).send()` by hand.

## Working on a module

Handlers that still need building are wired to `notImplemented('TICKET')` and return
**501** with their Jira key. Your job is to replace that stub with a real handler -
the route, the HTTP method and the role guard are already decided, so you only write
the body.

`GET /api/applications` in `server/src/controllers/applications.controller.js` is a
**complete reference implementation** with filtering and pagination. Read it before
starting your own endpoint.

On the client, screens that are not built render `<ModulePlaceholder>` listing what
that page owes. Replace the whole component when you build the real screen.

### Ground rules

1. Branch per ticket: `feature/KAN-123-short-description`.
2. One module per squad - if your change touches another squad's controller, talk to
   them first.
3. Do not add an npm dependency without asking; agree on one charting library, one
   date library, etc. across the whole team.
4. Never commit `.env` or anything with a real secret in it.
5. Test your endpoint with curl or Postman before opening the PR.

## API reference

| Method | Route | Access | Status |
|---|---|---|---|
| POST | `/api/auth/register` | public | done |
| POST | `/api/auth/login` | public | done |
| GET | `/api/auth/me` | any | done |
| POST | `/api/applications` | public | todo |
| GET | `/api/applications/status/:token` | public | todo |
| GET | `/api/applications` | admin, mentor | **done (reference)** |
| GET | `/api/applications/:id` | admin, mentor | todo |
| PATCH | `/api/applications/:id/stage` | admin, mentor | todo |
| POST | `/api/applications/:id/reviews` | admin, mentor | todo |
| POST | `/api/interns/from-application/:id` | admin | todo |
| GET | `/api/interns` | admin, mentor | todo |
| GET | `/api/interns/:id` | any | todo |
| PATCH | `/api/interns/:id` | admin | todo |
| PATCH | `/api/interns/:id/checklist/:itemId` | admin, mentor | todo |
| POST | `/api/tasks` | admin, mentor | todo |
| GET | `/api/tasks` | any | todo |
| PATCH | `/api/tasks/:id/submit` | intern | todo |
| PATCH | `/api/tasks/:id/review` | admin, mentor | todo |
| POST | `/api/activities` | intern | todo |
| GET | `/api/activities` | any | todo |
| GET | `/api/activities/summary/:internId` | admin, mentor | todo |
| GET | `/api/dashboard/admin` | admin | todo |
| GET | `/api/dashboard/mentor` | admin, mentor | todo |
| GET | `/api/dashboard/intern` | intern | todo |
