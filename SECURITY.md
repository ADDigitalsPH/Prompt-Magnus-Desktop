# Security Policy

## Supported Versions

Prompt Magnus Desktop is currently pre-1.0. Security fixes will target the latest public release once releases are published.

## Reporting A Vulnerability

Please do not report security vulnerabilities in public issues.

Until a dedicated security contact is published, send security reports to the maintainer through the contact channel listed on the public repository or project website.

Include:

- A clear description of the issue.
- Reproduction steps.
- Affected versions or commit hashes.
- Any relevant logs, screenshots, or proof-of-concept details.
- Whether the issue affects clipboard handling, global shortcuts, local prompt storage, build artifacts, or signing/release infrastructure.

## Scope

Security-sensitive areas include:

- Clipboard reading, writing, and restoration.
- Simulated paste behavior.
- Global shortcut handling.
- System tray/background behavior.
- Local prompt storage and import/export.
- GitHub Actions release workflow.
- Code signing and release artifacts.

## Code Signing

Official Windows release artifacts are intended to use SignPath Foundation for open-source code signing if the project is approved.

See [docs/code-signing.md](docs/code-signing.md).
