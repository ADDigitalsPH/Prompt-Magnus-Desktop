const isTauri = "__TAURI_INTERNALS__" in window;

export async function exportPromptBackup(exportedPrompts: string, defaultPath = "prompt-magnus-backup.json") {
  if (isTauri) {
    const [{ save }, { writeTextFile }] = await Promise.all([
      import("@tauri-apps/plugin-dialog"),
      import("@tauri-apps/plugin-fs")
    ]);
    const path = await save({
      defaultPath,
      filters: [{ name: "JSON", extensions: ["json"] }]
    });
    if (!path) {
      return false;
    }

    await writeTextFile(path, exportedPrompts);
    return true;
  }

  const url = URL.createObjectURL(new Blob([exportedPrompts], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = defaultPath;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
