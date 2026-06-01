# Contributing

Thank you for considering a contribution to Prompt Magnus Desktop.

## Project Scope

Prompt Magnus Desktop is a lightweight local-first desktop prompt launcher. The MVP should stay focused on saving, searching, and inserting reusable prompts quickly.

Avoid adding unrelated product scope such as cloud sync, accounts, analytics, prompt marketplaces, or AI generation unless the project roadmap explicitly changes.

## Development Setup

Prerequisites:

- Node.js 20 or newer
- npm
- Rust stable toolchain
- Windows WebView2 Runtime
- Tauri v2 prerequisites

Install dependencies:

```bash
npm ci
```

Run the app in development mode:

```bash
npm run tauri dev
```

Build the frontend:

```bash
npm run build
```

Check Rust:

```bash
cd src-tauri
cargo check
```

## Pull Request Guidelines

- Keep changes focused and easy to review.
- Do not mix unrelated refactors with feature changes.
- Preserve the local-first privacy model.
- Avoid storing secrets, certificates, `.pfx`, `.p12`, private keys, or API tokens in the repository.
- Update documentation when user-facing behavior changes.
- Include screenshots or notes for visible UI changes.
- Run relevant checks before opening a pull request.

## Release And Signing Changes

Changes to GitHub Actions, release scripts, SignPath configuration, and code signing policy are security-sensitive. Treat them as release infrastructure changes and request careful review.

See [docs/code-signing.md](docs/code-signing.md).
