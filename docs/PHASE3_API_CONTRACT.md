# Phase 3 Web — API contract (consume from battle-arena-api)

Base URL: `VITE_API_BASE_URL` (default `http://localhost:8000`)

## Auth (web = cookies, never bearer in localStorage)

1. `GET /sanctum/csrf-cookie` (credentials include)
2. `POST /api/register` `{ email, password, password_confirmation, handle, display_name, name? }`
3. `POST /api/login` `{ email, password }` — **omit** `device_name` for session auth
4. `POST /api/logout`
5. `GET /api/me`
6. `POST /api/forgot-password` `{ email }`
7. `POST /api/reset-password` `{ token, email, password, password_confirmation }`
8. `POST /api/email/verification-notification`
9. Email verify via link (Mailpit) → signed API route

All mutating requests: `credentials: 'include'`, `X-XSRF-TOKEN` from `XSRF-TOKEN` cookie, `Accept: application/json`, `Accept-Language`.

## Profile / collection / rules

- `PATCH /api/me/profile` `{ display_name?, bio?, handle?, collection_is_public? }`
- `PATCH /api/me/password` `{ current_password, password, password_confirmation }`
- `POST /api/me/avatar` multipart `avatar`
- `DELETE /api/me/avatar`
- `GET /api/players/{handle}`
- `GET /api/me/creatures`
- `POST /api/me/starter` `{ creature_slug }`
- `GET /api/me/creatures/{id}`
- `PATCH /api/me/creatures/{id}/select`
- `GET /api/game/rules` (public, rules_version 3.1.0): `progression` (arithmetic XP: `xp_increment_per_level`, `curve[]` with `xp_to_advance` / `total_xp_required`), `selection` (`stage_1`/`stage_2`/`stage_3` rules + `samples[]`), `battle` (`pve_min_trainer_level`, `pvp_min_trainer_level`, `rewards`, `playable`), `features`.
- `GET /api/me` `trainer` also carries owner-only `selection_allowances[] { evolution_stage, total, used, remaining }` and `pvp_level_unlocked`.
- `POST /api/me/creatures/acquire` `{ creature_slug, idempotency_key }` (additional selections; not wired in the UI yet).
- Avatar image: `GET /api/avatars/{userId}` (absolute URL from API)

## Routes to add

`/login` `/register` `/forgot-password` `/reset-password` `/profile` `/profile/edit` `/my-collection` `/game-rules` (public) `/players/:handle` `/verify-email`
