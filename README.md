# Battle Arena Web

React frontend for Battle Arena. Phase 2A adds a functional Creature Collection that reads from the Laravel API.

## Stack

- React + Vite + TypeScript
- React Router
- Tailwind CSS v4 (ember/slate theme, Sora + Oxanium)
- Vitest + Testing Library

## Requirements

- Node.js 22+
- Battle Arena API with migrated + imported catalog data

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set `VITE_API_BASE_URL` if the API is not at `http://localhost:8000`.

## Creature Collection

Routes:

- `/` — landing page (existing visual language preserved)
- `/creatures` — searchable, filterable, paginated catalog
- `/creatures/:slug` — detail with base stats and types

API access lives in `src/api/` (`client.ts`, `creatures.ts`, `types.ts`). Pages do not call PokéAPI.

Neutral placeholder art is used by default. Copyrighted provider sprites are not bundled.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Docker development

Prefer the sibling infra Compose stack:

```bash
cd ../battle-arena-infra
docker compose up --build -d
```

Web: http://localhost:3000
