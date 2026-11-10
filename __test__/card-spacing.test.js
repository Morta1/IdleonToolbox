import fs from 'node:fs';
import { describe, expect, it } from 'vitest';
import { repoRelative, sourceFiles } from './helpers/source-files';

const SCANNED_DIRS = ['components', 'pages'];

const CONTAINER = /<(Stack|Box|Grid)\b/;
const HAS_BOTTOM_MARGIN = /mb=\{3\}|mb:\s*3/;

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
        offenders.push(`${repoRelative(file)}:${index + 1} nested inside line ${parent.line}`);
      }
      stack.push({ indent, hasMargin, line: index + 1 });
    });
  }
  return offenders;
};

describe('card row spacing', () => {
  const files = sourceFiles(SCANNED_DIRS, /\.jsx$/);

  it('no container with a bottom margin sits inside another one', () => {
    expect(files.length).toBeGreaterThan(200);
    const offenders = findNestedBottomMargins(files);
    expect(offenders, `Doubled bottom margins:\n${offenders.join('\n')}`).toEqual([]);
  });
});
