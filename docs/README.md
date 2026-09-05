# Bloom docs

Keep API notes, wireframes, architecture decisions, and submission screenshots here.
The live OpenAPI documentation is available at `http://localhost:8000/docs`.

## Tree and daily-task API

- `POST /api/trees` creates a shared tree for two existing users.
- `GET /api/trees/{treeId}` returns the tree and its growth.
- `GET /api/trees/{treeId}/daily-tasks` returns the five tasks selected for today.
- `POST /api/tasks/daily/{dailyTaskId}/submissions` records a user's photo URL.
- `POST /api/dev/bootstrap` creates the demo records used before authentication exists.

A daily task is completed after both users have submitted it. Each tree can complete
at most three tasks per day. Completing a task adds its configured `growthValue` to
the tree, capped at 100.

If no shared task is completed for 15 days, the active tree changes to `dead` and
cannot accept more submissions. The pair must create a new tree, starting at 0%.

The current frontend calls the development bootstrap endpoint on startup and stores
selected images as data URLs. Replace that temporary behavior with authenticated user
IDs and uploaded file URLs when authentication and image storage are added.
