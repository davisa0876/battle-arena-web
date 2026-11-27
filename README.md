# Battle Arena Web

React frontend for Battle Arena. The redesign keeps the existing React Router routes while adding a feature-oriented structure, i18n, brand assets, and a cinematic dark UI.

## Running the project locally

The [`battle-arena-infra`](https://github.com/davisa0876/battle-arena-infra) repository is responsible for creating the local environment. Use it to run the whole project (database, Redis, storage, email, API, realtime and web) with Docker.

Clone it next to this repository and the other `battle-arena-*` repositories, then:

```bash
cd battle-arena-infra
docker compose up -d --build
```

First-time setup, environment files, URLs and troubleshooting are in the [infra README](https://github.com/davisa0876/battle-arena-infra#readme). The sections below also describe how to run the Vite dev server for hot reload; it still needs the API from this environment.

## Stack

- React + Vite + TypeScript
- React Router
- Tailwind CSS v4 with design tokens
- i18next + react-i18next + browser language detection
- Vitest + Testing Library

## Requirements

- Node.js 22.12+ for local development and tests
- Battle Arena API with migrated + imported catalog data

## Phase 5B.3 — Private PvP arena

- Lobby (`/pvp`): owned-creature selection, Ready lock, Enter Battle when `battle_id` exists
- Arena (`/pvp/battles/:battleId`): REST attack/defend, viewer-relative HUD/log, WS `pvp.battle.changed` hints only
- Smoke: `../battle-arena-api/docs/PHASE5B3_TWO_CLIENT_UI_SMOKE.md`
- `features.pvp` stays false until Phase 5B.4

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Vite serves on port 3000 by default. When the Compose environment is running it already owns port 3000, so use:

```bash
npm run dev -- --port 5173
```

Open [http://localhost:5173](http://localhost:5173); the API and realtime service accept that origin. Set `VITE_API_BASE_URL` if the API is not at `http://localhost:8000`.

## Structure

The app is organized by route and responsibility:

- `src/app/` contains providers, layouts, and router wiring.
- `src/features/creatures/` contains creature API calls, hooks, components, pages, and types.
- `src/features/home/` contains landing page UI.
- `src/shared/` contains reusable UI, layout, feedback, API, formatter, hook, and type utilities.
- `src/i18n/locales/{en,fr,pt-BR,it,es}/` contains `common`, `navigation`, `creatures`, and `errors` JSON namespaces with matching keys.

## Internationalization

Language detection prefers `localStorage` (`i18nextLng`), then browser settings. The language selector in the navigation persists changes, updates `document.documentElement.lang`, and API requests include `Accept-Language` mapped to `en`, `fr`, `pt-BR`, `it`, or `es`.

All user-facing strings live in locale JSON files, including navigation, home, loading, empty, error, stat labels, and accessibility labels.

## Design Tokens

Tailwind v4 tokens are declared in `src/index.css`:

- Background `#0B0F1B`
- Surface `#151C2B`
- Borders `#303C52`
- Ember `#FF6542`
- Electric `#27C9EC`
- Gold `#FFB84D`

The redesign uses the brand logo assets in `src/assets/brand/` and `public/favicon.*`, with reduced motion respected via `prefers-reduced-motion`.

## Creature Collection

Routes:

- `/` - landing page
- `/creatures` - searchable, filterable, paginated catalog
- `/creatures/:slug` - detail with hero image, types, dimensions, and base stats

Pages do not call external providers directly. Creature artwork uses `image_url` from the API with fallback to `image_ref`, then a neutral local placeholder through `CreatureImage` when artwork is missing or broken.

External PokéAPI artwork is demo-only IP and is not committed to this repository.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

## Docker (production build)

The sibling infra Compose environment builds this app (`vite build`) and serves it with Nginx, standing in for S3 + CloudFront:

```bash
cd ../battle-arena-infra
docker compose up -d --build
```

Web: http://localhost:3000

- There is no hot reload in the container. Rebuild with `docker compose up -d --build web`, or use the Vite dev server above.
- `VITE_API_BASE_URL` is fixed at build time.
- Tests, lint and typecheck run on the host, not in the `web` container.

See `../battle-arena-infra/README.md`.
