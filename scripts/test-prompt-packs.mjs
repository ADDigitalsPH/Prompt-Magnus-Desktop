import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

function importTypescriptModule(path) {
  const tempDir = mkdtempSync(join(tmpdir(), "prompt-packs-"));
  const outputPath = join(tempDir, "module.mjs");
  const source = readFileSync(path, "utf8")
    .replace(/import type \{[^}]+\} from "[^"]+";\n/g, "")
    .replace(/: string/g, "")
    .replace(/: LibraryFilter/g, "")
    .replace(/: Pick<Prompt, "packIds">/g, "");
  writeFileSync(outputPath, source);
  return import(pathToFileURL(outputPath)).finally(() => rmSync(tempDir, { recursive: true, force: true }));
}

const {
  createPackFilterId,
  getPackIdFromFilter,
  isPackFilter,
  maxPromptPacks,
  packFilterPrefix,
  promptHasPack
} = await importTypescriptModule("src/utils/promptPacks.ts");

assert.equal(maxPromptPacks, 20);
assert.equal(packFilterPrefix, "pack:");
assert.equal(createPackFilterId("client-work"), "pack:client-work");
assert.equal(isPackFilter("pack:client-work"), true);
assert.equal(isPackFilter("coding"), false);
assert.equal(getPackIdFromFilter("pack:client-work"), "client-work");
assert.equal(getPackIdFromFilter("favorites"), "");

assert.equal(promptHasPack({ packIds: ["client-work", "seo"] }, "seo"), true);
assert.equal(promptHasPack({ packIds: ["client-work"] }, "sales"), false);

console.log("Prompt pack utility tests passed.");
