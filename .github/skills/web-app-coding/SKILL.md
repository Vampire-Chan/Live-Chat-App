---
name: web-app-coding
description: "Use when coding, debugging, or validating the Live Chat App web app. Covers React/Vite frontend, Express/socket.io backend, auth, routing, UI, and regression checks."
argument-hint: "Implement or debug a Live Chat App task"
user-invocable: true
---

# Live Chat App Coding

## When to Use
- Implementing features in the client or server
- Fixing UI, routing, auth, socket, or API bugs
- Validating local regressions after an edit

## Workflow
1. Find the nearest controlling file, route, component, or handler.
2. Inspect only the local code needed to confirm the behavior.
3. Make the smallest correct change.
4. Validate with the narrowest useful command.

## Repo Notes
- `client/` is the React/Vite app.
- `server/` is the Express/socket.io backend.
- Preserve existing API shapes and auth flow unless the task requires a contract change.

## Suggested Checks
- Client UI changes: `npm run lint`
- Client production behavior: `npm run build`
- Server behavior: `npm run dev` or `npm start`

## Output
Summarize the change, the validation run, and any remaining risk.