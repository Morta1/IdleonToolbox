// Reports how many bytes of JS chunks each exported page pulls in. Used to prove the
// website-data split moved bytes off pages that never imported those keys, and to catch a
// page silently gaining weight.
//
// Usage: node utility/chunk-manifest.mjs [outDir] > manifest.json
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

const CHUNK_REF = /static\/chunks\/([A-Za-z0-9._-]+\.js)/g;

export function parseChunkRefs(html) {
  // Next lists each chunk twice - once as a <script src>, once inside __NEXT_DATA__ - so
  // matching without deduping doubles every page's reported weight.
  return [...new Set([...html.matchAll(CHUNK_REF)].map((m) => m[1]))];
}

function walk(dir, base = dir) {
  const found = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      if (entry !== '_next') found.push(...walk(full, base));
    } else if (entry.endsWith('.html')) {
      found.push(path.relative(base, full).split(path.sep).join('/'));
    }
  }
  return found;
}

export function buildManifest(outDir) {
  if (!existsSync(outDir)) return [];
  const chunkDir = path.join(outDir, '_next', 'static', 'chunks');
  const sizeOf = (name) => {
    const full = path.join(chunkDir, name);
    // A chunk named in the HTML but missing on disk is worth surfacing, not crashing on.
    return existsSync(full) ? statSync(full).size : 0;
  };
  return walk(outDir)
    .map((page) => {
      const chunks = parseChunkRefs(readFileSync(path.join(outDir, page), 'utf8'));
      return { page, chunks, bytes: chunks.reduce((sum, c) => sum + sizeOf(c), 0) };
    })
    .sort((a, b) => b.bytes - a.bytes || a.page.localeCompare(b.page));
}

// pathToFileURL, not a template string: on Windows import.meta.url is file:///C:/... with
// three slashes, so a hand-built `file://${argv[1]}` never matches and the CLI silently
// does nothing.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const outDir = process.argv[2] || path.resolve('out');
  process.stdout.write(JSON.stringify(buildManifest(outDir), null, 2));
}
