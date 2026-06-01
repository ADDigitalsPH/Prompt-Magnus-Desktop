import { useEffect } from "react";
import type { Prompt } from "../types/domain";

type BridgeHandlers = {
  openLauncher: () => void;
  newPrompt: (body?: string) => void;
};

const isTauri = "__TAURI_INTERNALS__" in window;

export async function hideCurrentWindow() {
  if (!isTauri) {
    return;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("close_launcher");
}

export async function openPromptLibraryNewPrompt() {
  if (!isTauri) {
    return;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("open_new_prompt");
}

export async function copyPrompt(prompt: Prompt) {
  if (isTauri) {
    const { writeText } = await import("@tauri-apps/plugin-clipboard-manager");
    await writeText(prompt.body);
    return;
  }

  await navigator.clipboard.writeText(prompt.body);
}

export async function pastePrompt(prompt: Prompt, restoreClipboard: boolean) {
  if (!isTauri) {
    await copyPrompt(prompt);
    return;
  }

  const { invoke } = await import("@tauri-apps/api/core");
  await invoke("paste_prompt", { body: prompt.body, restoreClipboard });
}

export async function readClipboardText() {
  if (isTauri) {
    const { readText } = await import("@tauri-apps/plugin-clipboard-manager");
    return readText();
  }

  return navigator.clipboard.readText();
}

export function useTauriBridge(handlers: BridgeHandlers) {
  useEffect(() => {
    if (!isTauri) {
      return;
    }

    let cleanup = () => undefined;

    async function setup() {
      const { listen } = await import("@tauri-apps/api/event");
      const unlistenLauncher = await listen("open-launcher", handlers.openLauncher);
      const unlistenNewPrompt = await listen("new-prompt", () => handlers.newPrompt());

      cleanup = () => {
        unlistenLauncher();
        unlistenNewPrompt();
      };
    }

    void setup();
    return () => cleanup();
  }, [handlers]);
}
