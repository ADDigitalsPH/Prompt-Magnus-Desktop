# SignPath Foundation Application Notes

Use these notes when applying for SignPath Foundation open-source code signing.

## Project Information

- Project name: Prompt Magnus Desktop
- Repository URL: https://github.com/ADDigitalsPH/Prompt-Magnus-Desktop
- Project website: https://github.com/ADDigitalsPH/Prompt-Magnus-Desktop
- Release URL: https://github.com/ADDigitalsPH/Prompt-Magnus-Desktop/releases/tag/v0.1.0
- License: MIT
- Maintainer: Arvin Del Rosario
- Contact email: arvinsdelrosario@gmail.com

## App Description

Prompt Magnus Desktop is an open-source Windows-first desktop prompt launcher. It lets users save reusable prompts locally and insert them into active desktop input fields using a global launcher shortcut.

Core workflow:

```text
Ctrl + Space -> search prompt -> press Enter -> paste prompt
```

The app is designed to be lightweight, local-first, private, and useful without a user account.

## Files That Need Signing

Expected Windows release artifacts may include:

- Tauri-generated `.exe` installer files.
- Tauri-generated `.msi` installer files.
- Other Windows installer or bundle files produced under `src-tauri/target/release/bundle/`.

The final file list depends on the Tauri bundler output and SignPath artifact configuration.

## Build System

Build system: GitHub Actions

The intended release workflow is:

1. Check out the public repository.
2. Install Node.js.
3. Install Rust stable.
4. Install npm dependencies.
5. Build the frontend.
6. Build the Tauri Windows app.
7. Upload unsigned artifacts.
8. Submit the unsigned artifacts to SignPath.
9. Publish signed artifacts and checksums.

## Safety Explanation

Prompt Magnus Desktop is not malware, spyware, adware, or a hacking tool.

It does not scan systems, exploit vulnerabilities, bypass security controls, harvest credentials, or collect user data for remote transmission.

## Clipboard Use

The app uses clipboard access to paste a selected prompt into the active input field.

During prompt insertion, it may temporarily store the previous clipboard text in memory so it can restore the user's clipboard after paste. The app does not intentionally upload clipboard content to external servers.

## Global Shortcut Use

The app registers a global `Ctrl + Space` shortcut so users can open the prompt launcher from other desktop applications.

The shortcut opens the launcher; it does not record keystrokes.

## System Tray And Background Behavior

Prompt Magnus Desktop can remain active in the background through the system tray. Closing the main window hides it by default so the global launcher shortcut can continue working.

The tray menu allows users to reopen the prompt library, open the launcher, create a new prompt, or quit the app.

## Local Storage

Prompt data, categories, and settings are stored locally on the user's device for the MVP. The app does not require cloud sync or a user account.
