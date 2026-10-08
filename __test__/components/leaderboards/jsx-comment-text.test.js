import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// A `//` line between two JSX elements is not a comment: React renders it as page text. One shipped
// to the preview inside the Global ranking card. Flag any `//` line whose previous code line closes a
// JSX tag, which is where that happens; inside `{...}` or `(...)` a `//` comment is real JavaScript.
const files = [
  ...readdirSync('components/leaderboards').filter((name) => name.endsWith('.jsx')).map((name) => join('components/leaderboards', name)),
  'components/common/Tabber.jsx',
  'pages/leaderboards.jsx'
];

const leakedComments = (source) => {
  const lines = source.split(/\r?\n/);
  const found = [];
  lines.forEach((line, at) => {
    if (!/^\s*\/\/ /.test(line)) return;
    let previous = at - 1;
    while (previous >= 0 && /^\s*\/\//.test(lines[previous])) previous--;
    const before = lines[previous] ?? '';
    if (/>\s*$/.test(before) && !/=>\s*$/.test(before)) found.push(`${at + 1}: ${line.trim()}`);
  });
  return found;
};

describe('JSX comment text', () => {
  it.each(files)('%s has no // line rendered as text between JSX elements', (file) => {
    expect(leakedComments(readFileSync(file, 'utf8'))).toEqual([]);
  });

  it('catches the shape that leaked', () => {
    expect(leakedComments('    </Stack>\n    // a note\n    <Box/>')).toHaveLength(1);
    expect(leakedComments('  return (\n    // a note\n    <Box/>')).toHaveLength(0);
    expect(leakedComments('  {rows.map((row) => (\n    // a note\n    <Box/>')).toHaveLength(0);
  });
});
