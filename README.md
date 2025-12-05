# User Wallet Desktop

> Secure identity + payments wallet for the BSV ecosystem, built with Tauri and React. This project is open for contributors who want to improve the wallet experience, security, and developer tooling.

![User Wallet screenshot](./screen.png)

## Why this project exists
- Offer a trustworthy BSV wallet that speaks modern protocols (BRC-100, Wallet Wire) and handles identity, permissions, and recovery by design.
- Provide an approachable codebase for contributors: Tauri for native, Vite + React + MUI on the frontend, Rust for the secure bits.
- Make it easy for app developers to integrate—JSON API over TCP/3321 today, Wallet Wire on TCP/3301 next.

## Quick start (5 minutes)
1) **Prereqs:** Node 18+, Rust toolchain, Tauri CLI (`npm i -g @tauri-apps/cli` if needed).  
2) **Install:** `npm i`  
3) **Run dev:** `npm run tauri dev`  
4) **Log in:** Pick network (mainnet/testnet), choose auth (Twilio phone today), set storage URL, complete greeter (phone → code → password), save your recovery key.  
5) **Build prod:** `npm run build` (frontend) or `npm run tauri build` (native bundle).

If you hit macOS build issues for Rollup, install `npm i -g @rollup/rollup-darwin-x64`.

## Project map
- `src/` — React app (routes under `pages`, shared UI under `components`, theme in `components/Theme.tsx`, context in `WalletContext.tsx` and `UserContext.tsx`).
- `src-tauri/` — Tauri host, TLS helper, updater, and native integrations.
- `public/` — Static assets for the Vite app.
- `scripts/` — Dev helpers (toolbox links, versioning).
- `docs/` — Static docs site.

## Development workflow
- **Type check & lint:** `npm run lint`
- **Frontend build:** `npm run build`
- **Native run:** `npm run tauri dev`
- **Native build:** `npm run tauri build`
- **Format:** `npm run format`

## How to contribute
We love thoughtful contributions. A great PR usually:
1) Opens an issue (or comments on one) describing the change and risk areas.  
2) Keeps scope tight (one concern per PR).  
3) Includes tests or manual test notes.  
4) Documents any config/env changes.  
5) Screenshots for UI tweaks.

Please file bugs with clear repro steps and platform info. For security-related findings, contact us privately first.

### Design & UX
- Stick to the User Wallet palette and typography (see `components/Theme.tsx`).
- Prefer accessible components and keyboard-friendly interactions.
- Add concise comments only where logic isn’t obvious.

### Code style
- TypeScript strictness: favor explicit types for public APIs.
- Avoid silent catches; surface actionable errors to the UI/toast where relevant.
- Keep modules cohesive; extract helpers over adding one-off inline lambdas.

## Support & questions
- Open a GitHub issue for bugs or feature requests.
- For wallet behavior questions, include logs and platform (macOS/Windows/Linux) plus steps to reproduce.

## Roadmap snapshots
- Wallet Wire support on TCP/3301
- More granular permission surfaces and auditability
- Improved onboarding flows and recovery safety rails

## License

PROPRIETARY
