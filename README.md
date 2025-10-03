# Choose Your Own Adventure Nursing

Interactive neutropenic sepsis triage simulator for nurses. The project packages the free-text scenario into a web experience with a glassmorphism UI, ambient audio, and a secure serverless rules engine so you can deploy to Vercel and share the case widely.

## Tech stack

- **Frontend**: React 19 + Vite + TypeScript, React Query, Framer Motion animations, CSS modules (no Tailwind)
- **Audio & UX**: custom Web Audio hook for ambient loops and success cues
- **Simulation engine**: TypeScript state machine running inside Vercel serverless functions with AES-GCM–sealed session tokens
- **Tooling**: ESLint, Vitest, Testing Library, Prettier-friendly config

## Project layout

```
api/                # Vercel serverless functions (Node runtime)
server/src/         # Shared simulation engine, signing helpers, unit tests
src/                # React application (components, pages, hooks, styles)
  components/       # UI atoms (glass cards, vitals, timeline)
  hooks/            # API + soundscape hooks
  pages/            # Simulator screen
  services/         # API client wrapper
  types/            # Shared public types for simulation payloads
public/             # Static assets served by Vite/Vercel
```

## Getting started

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Run the dev servers**

   ```bash
   # Terminal 1 – start the Vite client on http://localhost:5173
   npm run dev

   # Terminal 2 – start Vercel functions locally (needs the Vercel CLI)
   vercel dev
   ```

   Vite automatically proxies `/api/*` to the URL defined in `VITE_API_PROXY`. When using `vercel dev` on port 3000 you can export:

   ```bash
   export VITE_API_PROXY=http://localhost:3000
   ```

   If you prefer not to run `vercel dev`, you can deploy the functions and point `VITE_API_BASE_URL` at the live domain.

3. **Environment variables**

   | Variable | Where | Purpose |
   | --- | --- | --- |
   | `SIM_SIGNATURE_SECRET` | Vercel project → Environment Variables | 32+ character secret used to encrypt simulation state tokens |
   | `ALLOWED_ORIGIN` | Optional | Restricts CORS for the API (defaults to `*` for local dev) |

   The serverless function does not call external LLMs by default. If you extend it to proxy OpenAI or another provider, inject the API key in the same way so it stays on the server side.

4. **Useful scripts**

   ```bash
   npm run lint          # ESLint across client + server
   npm test              # Vitest unit & component tests
   npm run build         # Type-check and build production bundle
   npm run preview       # Serve build output locally
   npm run typecheck     # Isolated TypeScript check
   ```

## Deployment (Vercel)

1. Push the repository to GitHub (`Mathewmoslow/chooseyourownadventurenursing`).
2. Create a new Vercel project from that repo.
3. Set `SIM_SIGNATURE_SECRET` (and optionally `ALLOWED_ORIGIN`) in the Vercel dashboard.
4. Deploy – Vercel uses `vercel.json` to run `npm run build`, output `dist/`, and host the `/api` functions.

The SPA routes are handled by the rewrite in `vercel.json`, so refreshing deep links just works.

## Simulation engine highlights

- Tracks MAP, heart rate, lactate, labs, infusions, and timed resource arrivals.
- Severity score drifts up each minute without antibiotics/fluids and falls when you intervene early.
- AES-GCM tokens (`SIM_SIGNATURE_SECRET`) carry encrypted state between turns so users cannot tamper with the scenario from the client.
- Serverless response returns the latest public snapshot, log entry, and refreshed token.

Unit tests cover the happy path (rapid antibiotic + fluids) and the failure path (repeated inaction). A basic component test guards the action console wiring.

## Audio & accessibility

- The ambient soundscape is off by default; players can toggle it in the console.
- Success cues only fire after the first real action to avoid autoplay restrictions.
- All primary cards use semantic headings and consistent contrast to aid readability.

## Extending the case

- Add alternative scenarios by expanding `server/src/engine.ts` or wiring in an LLM behind the existing API surface.
- Hook up analytics by instrumenting the `logEntry` payload or React Query mutation lifecycle.
- Swap the styling layer by adding additional CSS modules—Tailwind is intentionally unused per project requirements.

## Notes

- Vitest prints a deprecation warning for `environmentMatchGlobs`. It keeps the config concise for now; migrate to `test.projects` later if you need per-project reporting.
- `SIM_SIGNATURE_SECRET` defaults to a dev-safe string when unset – always override it in production deployments.
- The repo ships without Tailwind. All glassmorphism effects are plain CSS and adjustable inside `src/components/**/*.module.css`.

Happy simming!
