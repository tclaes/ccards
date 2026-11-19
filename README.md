# ccards

Nx monorepo with an Angular web app (`apps/web`).

## Requirements

- Node.js 24 (see `.nvmrc`; run `nvm use`)
- npm

## Stack

| Tool                | Version  |
| ------------------- | -------- |
| Nx                  | 24.0.0   |
| Angular             | 22.2     |
| Vitest (unit tests) | 4.x      |
| TypeScript          | 6.0      |
| ESLint, Prettier    | 9.x, 3.x |

The app uses standalone components, signals and zoneless change detection (no `zone.js`).

## Getting started

```sh
nvm use
npm ci
```

## Commands

```sh
npx nx serve web   # dev server on http://localhost:4200
npx nx lint web    # ESLint
npx nx test web    # unit tests (Vitest)
npx nx build web   # production build to dist/apps/web
npm run format:check   # Prettier check
npm run format         # Prettier write
```

## Specs

Behavior and planned changes are tracked with [OpenSpec](https://github.com/Fission-AI/OpenSpec) in `openspec/`.
