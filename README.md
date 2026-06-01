# Prompt Magnus Desktop

Prompt Magnus Desktop is a lightweight Windows-first desktop prompt launcher. It lets users save reusable prompts locally and insert them into any active desktop input field with a global launcher shortcut.

Core workflow:

```text
Ctrl + Space -> search prompt -> press Enter -> paste prompt
```

The app is designed to be local-first, private, keyboard-friendly, and useful without an account.

## Features

- Save reusable prompts with title, body, category, and favorite status.
- Add and rename prompt categories.
- Browse prompts in a compact desktop library.
- Search prompts from the main library or launcher.
- Open a floating launcher with `Ctrl + Space`.
- Paste the selected prompt into the previously active input field.
- Copy a prompt without pasting using `Ctrl + Enter` in the launcher.
- Save clipboard text into a new prompt with `Ctrl + Shift + S`.
- Run in the background through the system tray.
- Import and export prompt backups as JSON.
- Dark, light, and system theme settings.

## Privacy And Local Data

Prompt Magnus Desktop stores prompt data locally on the user's device for the MVP. It does not require cloud sync, an account, or an external prompt service.

Current local data is stored by the app frontend using browser `localStorage` inside the Tauri WebView. Prompt backups can also be exported manually as JSON.

See [PRIVACY.md](PRIVACY.md) for the full privacy statement.

## Global Shortcuts

Default shortcuts:

- `Ctrl + Space`: Open the launcher.
- `Ctrl + Shift + S`: Create a new prompt from clipboard text.
- `Ctrl + N`: Create a new prompt when the main app window is focused.
- `Enter`: Paste the selected launcher result.
- `Ctrl + Enter`: Copy the selected launcher result without pasting.
- `Esc`: Close the launcher or prompt editor.
- `Arrow Up` / `Arrow Down`: Navigate launcher results.

Global shortcuts are registered by the Tauri global shortcut plugin.

## Clipboard-Based Paste Insertion

Prompt insertion uses the clipboard for broad desktop compatibility:

1. The app captures the previously focused desktop window before the launcher opens.
2. When the user selects a prompt, the launcher hides.
3. The app stores the current clipboard text temporarily when clipboard restoration is enabled.
4. The selected prompt body is copied to the clipboard.
5. The app restores focus to the previous target window.
6. The app simulates `Ctrl + V`.
7. The previous clipboard text is restored after paste.

If clipboard restoration fails, the app should not crash.

## Install

Official signed release installers are not available until the project is approved for open-source code signing and a release workflow is finalized.

For now, install from source:

```bash
npm ci
npm run tauri build
```

Windows installers are expected under:

```text
src-tauri/target/release/bundle/
```

## Run Locally

Install prerequisites:

- Node.js 20 or newer
- npm
- Rust stable toolchain
- Windows WebView2 Runtime
- Tauri v2 system prerequisites

Install dependencies:

```bash
npm ci
```

Run the frontend dev server:

```bash
npm run dev
```

Run the Tauri desktop app in development mode:

```bash
npm run tauri dev
```

## Build From Source

Build the frontend:

```bash
npm run build
```

Check the Rust/Tauri project:

```bash
cd src-tauri
cargo check
```

## Create A Windows Release Build

From the repository root on Windows:

```bash
npm ci
npm run build
npm run tauri build
```

Expected release artifacts are generated under:

```text
src-tauri/target/release/bundle/
```

Common Windows artifacts may include `.msi`, `.exe`, or other Tauri bundle outputs depending on the configured Tauri bundler targets.

## Code Signing Policy

Prompt Magnus Desktop is being prepared for SignPath Foundation's free open-source code signing process.

See [docs/code-signing.md](docs/code-signing.md).

## Release Process

Release preparation files:

- [docs/release-checklist.md](docs/release-checklist.md)
- [.github/RELEASE_TEMPLATE.md](.github/RELEASE_TEMPLATE.md)
- [.github/workflows/windows-release.yml](.github/workflows/windows-release.yml)

## Contributing

Contributions are welcome once the public repository is available. See [CONTRIBUTING.md](CONTRIBUTING.md).

## Security

Please report security issues privately. See [SECURITY.md](SECURITY.md).

## License

Prompt Magnus Desktop is licensed under the MIT License. See [LICENSE](LICENSE).
