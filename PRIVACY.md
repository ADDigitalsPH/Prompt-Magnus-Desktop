# Privacy Policy

Prompt Magnus Desktop is a local-first desktop utility for saving and inserting reusable prompts.

## Local Prompt Storage

Prompt data is stored locally on the user's device. For the current MVP, prompt data, categories, and settings are stored by the Tauri WebView frontend using local browser storage.

The app does not require cloud sync, a user account, or a remote database for the MVP.

## Clipboard Access

Prompt Magnus Desktop uses clipboard access to paste selected prompts into the user's active input field.

When the user chooses a prompt from the launcher, the app may:

1. Read the current clipboard text.
2. Temporarily store that clipboard text in memory.
3. Write the selected prompt body to the clipboard.
4. Simulate paste into the previously focused window.
5. Restore the previous clipboard text after insertion when clipboard restoration is enabled.

Clipboard content is used only for prompt insertion and restoration. The app does not intentionally upload clipboard content to external servers.

## Network Use

The MVP does not intentionally upload prompt content, category data, settings, or clipboard content to external servers.

The app can run offline.

## Future Features

If future cloud sync, account, sharing, analytics, update telemetry, or hosted backup features are added, this privacy policy must be updated before those features are released.

## Third-Party Components

Prompt Magnus Desktop is built with open-source dependencies, including Tauri, React, Vite, Rust crates, and npm packages. Those components may have their own licenses and security practices.

## Contact

For privacy questions, use the contact information published in the public repository or release page.
