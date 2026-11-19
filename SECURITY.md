# Security policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.0.x   | Yes       |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

Email the maintainer via GitHub ([@mgfreshour](https://github.com/mgfreshour)) with:

- A description of the issue and impact
- Steps to reproduce
- Any suggested fix, if you have one

We aim to acknowledge reports within a few business days.

## Local data and secrets

- **Memory data** (SQLite, LanceDB under your `--data-dir`) may contain project-specific text from your agents. Treat that directory as sensitive; it is not uploaded by the MCP server.
- **`.env`** is gitignored. Do not commit API keys or local paths.
- **Debug server** (`--debug-server`) exposes an unauthenticated HTTP API. Use it only on `localhost` during development, not on untrusted networks.