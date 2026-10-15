# OctoFit Tracker architecture

OctoFit Tracker is a three-tier application for a school fitness program. The starter code includes API contracts and intentionally incomplete implementation points so you can use GitHub Copilot agent mode in a test-driven loop.

![Three-tier OctoFit architecture](../.github/images/octofit-architecture.svg)

## Tier boundaries

- **Presentation tier**: React 19, Vite, React Router, Bootstrap, and a shared API client in `octofit-tracker/frontend/src`.
- **Logic tier**: Express and TypeScript routes/services in `octofit-tracker/backend/src` expose `/api/*` behavior on port `8000`.
- **Data tier**: Mongoose models and seed data in `octofit-tracker/backend/src/models` and `src/scripts/seed.ts` persist to MongoDB on port `27017`.

## Ports and environment rules

- MongoDB: `27017`
- Express API: `8000`
- Vite frontend: `5173`
- The browser calls relative `/api` paths. Vite proxies them to `http://localhost:8000`, so the unauthenticated API port stays private in Codespaces. `VITE_API_BASE_URL` can override the base URL.

## API contract

| Capability | Method and path | Expected behavior |
| --- | --- | --- |
| Activity tracking | `GET /api/activities`, `POST /api/activities` | List and create valid activity records. POST accepts `userId`, `teamId`, `type`, and `minutes`; `userId` and `teamId` must be well-formed IDs for an existing user and team; otherwise respond with a deliberate 4xx (never a 500 from a cast error). A created activity stores the submitted `user`, `team`, `type`, and `minutes` plus computed `points` and `occurredAt`. |
| Teams | `GET /api/teams`, `POST /api/teams` | List and create teams with members. Created and listed teams keep the submitted `name` and `mascot`. Reject a team without a name with `400`. |
| Leaderboard | `GET /api/leaderboard` | Return teams ordered by the sum of their activity points, highest first. Each entry has `teamName`, `totalPoints`, and a 1-based `rank`. |
| Workout suggestions | `GET /api/workouts/suggestions/:userEmail` | Recommend workouts from recent activity patterns for the matching seeded user's email address. The first suggestion's `focus` matches that user's goal or recent activity, with a `reason` explaining why. An email with no matching user returns a deliberate 4xx (for example, `404`). |

## Implementation decisions

- Presentation tier decision: Keep route pages and capability components responsible for rendering only. Use the shared API client for typed `/api` requests; each view exposes accessible loading, empty, and error states and renders the response data without duplicating API behavior.
- Logic tier decision: Keep Express routes thin and place validation, persistence orchestration, scoring, aggregation, and recommendation selection in `services/octofitService.ts`. Return deliberate 4xx responses for invalid input or missing resources; do not expose Mongoose cast errors as 500s.
- Data tier decision: Keep persistence rules in the Mongoose models: require meaningful user identity and goal fields, required team name and mascot with an empty members default, activity references and scoring/date fields, and workout focus/duration/difficulty. Keep seed data representative and idempotent.
- Activity tracking approach: Accept `userId`, `teamId`, `type`, and positive integer `minutes`; validate ID format and confirm both referenced records exist before writing. Store the references as `user` and `team`, compute points centrally at one point per minute, and set `occurredAt` on the server.
- Team management approach: Require a non-empty trimmed name, preserve the submitted mascot, and persist supplied member IDs as member references. Omitted members default to an empty array; reject malformed or nonexistent member IDs with a deliberate 4xx.
- Leaderboard approach: Sum activity points by team, include teams with no activity at zero points, sort by total points descending with team name as a deterministic tie-breaker, and assign 1-based ranks in the returned order.
- Workout suggestions approach: Find the user by normalized email; return 404 when there is no match. Prefer workouts matching the user's fitness goal, falling back to their most recent activity type when needed; put the best match first and include a reason tied to the goal or activity.

## Test plan

- **Data tier:** `npm run test:data --prefix octofit-tracker/backend` (baseline: 4 failed, 1 passed). Failures identify missing required-field validation in the User, Team, Activity, and Workout models; the idempotent seed test passes.
- **API:** `npm run test:api --prefix octofit-tracker/backend` (baseline: 4 failed). Activity and team creation still return 501, the leaderboard is empty instead of ranked, and workout suggestions do not select a user-specific match. These failures indicate missing or incomplete service behavior.
- **Frontend:** `npm test --prefix octofit-tracker/frontend` (baseline: 15 failed). All capability pages remain placeholders; data rendering, user-specific requests, loading states, empty states, and accessible error states are not implemented.
- **Backend build:** `npm run build --prefix octofit-tracker/backend` (not run for this baseline). Run after backend changes; failures indicate TypeScript or backend integration/build issues.
- **Frontend build:** `npm run build --prefix octofit-tracker/frontend` (not run for this baseline). Run after frontend changes; failures indicate TypeScript or frontend integration/build issues.
- **Verification order:** Run data tests after model/seed work, API tests after service/route work, and frontend tests after view work; then run both builds and rerun all three test suites as the final regression check.
