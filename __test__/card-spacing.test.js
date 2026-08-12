import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '..');
const SCANNED_DIRS = ['components', 'pages'];

const CONTAINER = /<(Stack|Box|Grid)\b/;
const HAS_BOTTOM_MARGIN = /mb=\{3\}|mb:\s*3/;

const collectFiles = (dir, out = []) => {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) collectFiles(full, out);
    else if (entry.endsWith('.jsx')) out.push(full);
  }
  return out;
};

const findNestedBottomMargins = (files) => {
  const offenders = [];
  for (const file of files) {
    const stack = [];
    fs.readFileSync(file, 'utf8').split('\n').forEach((line, index) => {
      if (!CONTAINER.test(line)) return;
      const indent = line.search(/\S/);
      const hasMargin = HAS_BOTTOM_MARGIN.test(line);
      while (stack.length && stack[stack.length - 1].indent >= indent) stack.pop();
      const parent = stack[stack.length - 1];
      if (hasMargin && parent?.hasMargin) {
        offenders.push(`${path.relative(ROOT, file)}:${index + 1} nested inside line ${parent.line}`);
      }
      stack.push({ indent, hasMargin, line: index + 1 });
    });
  }
  return offenders;
};

describe('card row spacing', () => {
  const files = SCANNED_DIRS.flatMap((dir) => collectFiles(path.join(ROOT, dir)));

  it('finds files to check at all', () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it('detects the nested shape it is meant to catch', () => {
    const fixture = path.join(ROOT, '__test__', '.nested-margin-fixture.jsx');
    fs.writeFileSync(fixture, [
      '<Stack mb={3} direction={\'row\'} flexWrap={\'wrap\'}>',
      '  <Stack mb={3} direction={\'row\'} flexWrap={\'wrap\'}>',
      '  </Stack>',
      '</Stack>'
    ].join('\n'));
    try {
      expect(findNestedBottomMargins([fixture])).toHaveLength(1);
    } finally {
      fs.unlinkSync(fixture);
    }
  });

  it('no container with a bottom margin sits inside another one', () => {
    const offenders = findNestedBottomMargins(files);
    expect(offenders, `Doubled bottom margins:\n${offenders.join('\n')}`).toEqual([]);
  });
});
