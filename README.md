# Dev Wrapped

"Spotify Wrapped" for any GitHub user. Enter a username and get a short, animated story of their last 12 months on GitHub: total contributions, top languages, busiest hour and weekday, streaks, most-contributed repo and a coder personality. The last slide is a shareable summary card.

> Work in progress.

## Tech stack

- Next.js (App Router) + TypeScript (strict) + Tailwind CSS
- Framer Motion for slide animations
- Vitest (unit tests) and Playwright (end-to-end test)
- Deployed on Vercel

## Run locally

Requirements: Node.js 24 LTS.

```bash
npm install
cp .env.example .env.local   # then paste your GitHub token into .env.local
npm run dev
```

Open http://localhost:3000.

### Getting a GitHub token

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token. Choose "Public repositories" (read-only) and add no extra permissions.

## Scripts

| Command             | What it does                   |
| ------------------- | ------------------------------ |
| `npm run dev`       | Start the dev server           |
| `npm run build`     | Production build               |
| `npm run lint`      | ESLint                         |
| `npm run typecheck` | TypeScript check (no emit)     |
| `npm test`          | Unit tests (Vitest)            |
| `npm run format`    | Format all files with Prettier |

## How it works

_Coming soon: architecture, data flow and design decisions (see `docs/overview.html`)._
