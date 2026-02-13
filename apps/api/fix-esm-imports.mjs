/**
 * Post-build script: adds .js extensions to relative imports in compiled ESM output.
 *
 * Node.js ESM requires explicit file extensions and does not support directory
 * imports. TypeScript with moduleResolution:"bundler" emits bare specifiers
 * (e.g. './config') which Node rejects at runtime.
 *
 * This script walks dist/, finds every .js file, and rewrites:
 *   from './foo'   →  from './foo.js'        (if foo.js exists)
 *   from './foo'   →  from './foo/index.js'   (if foo/index.js exists)
 */

import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, "dist");

const IMPORT_RE = /(from\s+['"])(\.\.?\/[^'"]+)(['"])/g;
const EXPORT_RE = /(export\s+\*\s+from\s+['"])(\.\.?\/[^'"]+)(['"])/g;
const DYNAMIC_RE = /(import\s*\(\s*['"])(\.\.?\/[^'"]+)(['"]\s*\))/g;

async function exists(p) {
  try {
    await stat(p);
    return true;
  } catch {
    return false;
  }
}

async function fixImport(importPath, fileDir) {
  // Already has .js / .mjs / .json extension — skip
  if (/\.(js|mjs|cjs|json)$/.test(importPath)) return importPath;

  const absBase = resolve(fileDir, importPath);

  // Case 1: it's a file  ./foo  →  ./foo.js
  if (await exists(absBase + ".js")) {
    return importPath + ".js";
  }

  // Case 2: it's a directory  ./foo  →  ./foo/index.js
  if (await exists(join(absBase, "index.js"))) {
    return importPath + "/index.js";
  }

  // Fallback — don't touch it (e.g. node_modules package)
  return importPath;
}

async function processFile(filePath) {
  const src = await readFile(filePath, "utf8");
  const fileDir = dirname(filePath);
  let changed = false;

  // Collect all unique specifiers first
  const specifiers = new Set();
  for (const re of [IMPORT_RE, EXPORT_RE, DYNAMIC_RE]) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(src)) !== null) {
      specifiers.add(m[2]);
    }
  }

  // Resolve them all
  const resolved = new Map();
  for (const spec of specifiers) {
    resolved.set(spec, await fixImport(spec, fileDir));
  }

  // Replace
  let out = src;
  for (const [orig, fixed] of resolved) {
    if (orig !== fixed) {
      // Replace all occurrences of this exact specifier
      out = out.replaceAll(orig, fixed);
      changed = true;
    }
  }

  if (changed) {
    await writeFile(filePath, out);
  }
  return changed;
}

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      files.push(...(await walk(full)));
    } else if (e.name.endsWith(".js")) {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await walk(DIST);
  let fixed = 0;
  for (const f of files) {
    if (await processFile(f)) fixed++;
  }
  console.log(`✅ Fixed ESM imports in ${fixed}/${files.length} files`);
}

main().catch((err) => {
  console.error("❌ fix-esm-imports failed:", err);
  process.exit(1);
});
