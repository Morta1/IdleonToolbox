import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Every `// UPKEEP:` marker under the entity-graph scripts and in SHARED_UPKEEP_FILES: the hand-kept indexes, offsets
// and string cuts a game patch can silently break. new-it-version runs this and checks each one.
const MARKER = /\/\/\s*(UPKEEP:.*)$/;
// A whole-line comment, so a wrapped marker carries on through it.
const CONTINUATION = /^\s*\/\/\s*(.*)$/;

// The marker's own line plus every `//` line wrapped under it, up to a code line, a blank `//`
// or the next marker.
const markerText = (lines, index, first) => {
  const parts = [first.trim()];
  for (let next = index + 1; next < lines.length; next++) {
    const text = CONTINUATION.exec(lines[next])?.[1].trim();
    if (!text || MARKER.test(lines[next])) break;
    parts.push(text);
  }
  return parts.join(' ');
};

// Hand-kept wiki text outside the build scripts, because an app page reads it too; relative to the scripts dir.
export const SHARED_UPKEEP_FILES = ['../../utility/wiki/menagerie-jellies.mjs'];

export const findUpkeep = (dir) => {
  const found = [];
  const scripts = fs.readdirSync(dir, { recursive: true }).map((relative) => String(relative).split(path.sep).join('/'))
    .filter((file) => file.endsWith('.mjs') && file !== 'upkeep.mjs');
  for (const file of [...scripts, ...SHARED_UPKEEP_FILES]) {
    const lines = fs.readFileSync(path.join(dir, file), 'utf-8').split(/\r?\n/);
    lines.forEach((content, index) => {
      const match = MARKER.exec(content);
      if (match) found.push({ file, line: index + 1, text: markerText(lines, index, match[1]) });
    });
  }
  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  for (const { file, line, text } of findUpkeep(dir)) console.log(`${path.posix.join('scripts/entity-graph', file)}:${line}  ${text}`);
}
