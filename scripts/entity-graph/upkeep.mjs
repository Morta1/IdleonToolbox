import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Every `// UPKEEP:` marker under the entity-graph scripts: the hand-kept indexes, offsets and
// string cuts a game patch can silently break. new-it-version runs this and checks each one.
const MARKER = /\/\/\s*(UPKEEP:.*)$/;

export const findUpkeep = (dir) => {
  const found = [];
  for (const relative of fs.readdirSync(dir, { recursive: true })) {
    const file = String(relative).split(path.sep).join('/');
    if (!file.endsWith('.mjs') || file === 'upkeep.mjs') continue;
    fs.readFileSync(path.join(dir, relative), 'utf-8').split(/\r?\n/).forEach((content, index) => {
      const match = MARKER.exec(content);
      if (match) found.push({ file, line: index + 1, text: match[1].trim() });
    });
  }
  return found.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
};

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const dir = path.dirname(fileURLToPath(import.meta.url));
  for (const { file, line, text } of findUpkeep(dir)) console.log(`scripts/entity-graph/${file}:${line}  ${text}`);
}
