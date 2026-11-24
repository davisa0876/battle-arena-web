# Battle Arena Web

React frontend for Battle Arena. The redesign keeps the existing React Router routes while adding a feature-oriented structure, i18n, brand assets, and a cinematic dark UI.

## Stack

- React + Vite + TypeScript
- React Router
- Tailwind CSS v4 with design tokens
- i18next + react-i18next + browser language detection
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

## Docker development

Prefer the sibling infra Compose stack:

```bash
cd ../battle-arena-infra
docker compose up --build -d
```

Web: http://localhost:3000
