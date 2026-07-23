# Architecture and Development Guidelines

## Node.js/Express Architecture
- The backend is built using a Node.js/Express architecture to serve APIs and manage server-side logic.
- Ensure that routes are modularized appropriately.
- Follow RESTful principles for API endpoints.

## Offline-First Sync Logic
- The application uses an offline-first approach utilizing a Service Worker (`sw.js`) and Background Sync.
- Assets are cached using the Cache API for offline access.
- Data changes made while offline are queued in `pending-sync` within IndexedDB.
- When an internet connection is detected or `sync` event is triggered, the `SyncManager` processes the `pending-sync` queue to send data to the backend, then clears the local sync queue.

## Upsert ID Matching Approach
- In `db.js`, an upsert approach is used when storing items in the local data store (IndexedDB / LocalStorage fallback).
- Records are matched primarily by checking if the incoming data `id` or `key` already exists in the local store.
- If a match is found (by `id` or `key`), the existing record is updated/overwritten. If no match is found, a new record is created (with a generated auto-increment ID if needed).

## Managing Sensitive Keys
- Never commit sensitive keys, secrets, or API tokens to the repository.
- Use a `.env` file for local development to manage environment variables.
- Ensure that `.env` and any other files containing sensitive data are added to `.gitignore`.
- Reference configuration via environment variables in the codebase (e.g., `process.env.SECRET_KEY`).
