import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * CardTitleAndValue carries no margin of its own - the container laying the cards out owns the
 * spacing. A codemod stamped `mb={3}` onto those containers, and in four places it stamped one onto
 * a container that is itself a flex child of another `mb={3}` container.
 *
 * That double-counts. `gap` and a child's `margin` ADD for a wrapped row, so the inner row ended up
 * 40px from its neighbour where 24px was intended. It is invisible in a diff - both lines look
 * correct on their own - and invisible to a rendered check unless you measure the wrapped case
 * specifically.
 *
 * This is the third distinct way spacing has gone wrong in this area (a card margin that worked in
 * two directions removed and only checked in one; a wrapper measured instead of the card; now this),
 * hence a gate rather than another round of fixes.
 */
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

/**
 * Nesting is tracked by indentation rather than by parsing JSX. That is approximate, but it is the
 * approximation that matches how these files are actually formatted, and the assertion is paired
 * below with a fixture proving the walk detects the shape at all.
 */
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
    // The rule below asserts an empty list, so without this it would pass just as happily with a
    // walk that never matched anything.
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
