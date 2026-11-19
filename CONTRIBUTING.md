# Contributing to dont-forget

Thanks for your interest in improving dont-forget.

## Development setup

```bash
git clone https://github.com/mgfreshour/dont-forget.git
cd dont-forget
npm install
npm run build
npm test
```

Integration and Cursor client smoke tests (optional):

```bash
npm run test:integration
npm run test:cursor
```

## Making changes

1. Open an issue or comment on an existing one before large changes.
2. Create a branch from `master`.
3. Keep changes focused and match existing TypeScript style.
4. Add or update unit tests in `src/tools/*.test.ts` for behavior you change.
5. Run `npm test` before opening a pull request.
6. Update `README.md` when user-facing behavior or configuration changes.

## Architecture notes

- **`src/db/`** — Storage only; returns raw data structures.
- **`src/tools/`** — MCP tool logic and formatted output for agents.
- **`src/web/`** — Optional debug HTTP API and static UI (`--debug-server`).

## Pull requests

- Describe what changed and why.
- Link related issues when applicable.
- Ensure CI-style checks pass locally (`npm run build && npm test`).

## Security

See [SECURITY.md](./SECURITY.md) to report vulnerabilities.