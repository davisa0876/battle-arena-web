# Battle Arena Web

Phase 1 frontend for Battle Arena. It provides the game landing page and reports
the availability of the Battle Arena API.

## Stack

- React + Vite + TypeScript
- Tailwind CSS (no Bootstrap)

## Requirements

- Node.js 22
- npm
- Battle Arena API (optional for UI development)

## Local setup

```bash
cp .env.example .env
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Set
`VITE_API_BASE_URL` in `.env` if the API is not running at
`http://localhost:8000`.

## Quality checks

```bash
npm run typecheck
npm run lint
npm run build
```

## Docker development

```bash
docker build -t battle-arena-web .
docker run --rm -p 3000:3000 --env-file .env battle-arena-web
```

The Vite development server listens on `0.0.0.0:3000`, with hot reload enabled.
For Docker Desktop, bind-mount the project directory to `/app` to reflect host
file changes inside the container.
