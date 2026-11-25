import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// Every exported wiki page inlines the CSS of everything it renders, and most of it is the same on all of
// them: about 46 of 48 KB across 8,300 pages, against GitHub Pages' 1 GB limit. This moves the classes many
// pages use into one content-hashed stylesheet and leaves each page the ones only it needs.
//
// Emotion reads the ids it must not insert again from the style tag's data-emotion attribute, so the
// attribute stays whole when its rules leave.
const STYLE = /<style data-emotion="css ([^"]*)">([\s\S]*?)<\/style>/;

// Below this share of pages a class costs every reader more than the pages it would shrink save.
const SHARED_FROM = 0.1;

// Top-level blocks of a stylesheet, in order. Emotion's CSS has no braces inside strings.
export const splitRules = (css) => {
  const rules = [];
  let depth = 0;
  let start = 0;
  for (let i = 0; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}' && --depth === 0) {
      rules.push(css.slice(start, i + 1));
      start = i + 1;
    }
  }
  if (depth !== 0 || css.slice(start).trim()) throw new Error('share-wiki-css: unbalanced CSS');
  return rules;
};

// All of one class's rules (its hover, its media queries) move together, so their order never changes.
export const groupByClass = (css) => {
  const groups = new Map();
  for (const rule of splitRules(css)) {
    const id = rule.match(/\.css-([\w-]+)/)?.[1] ?? '';
    groups.set(id, (groups.get(id) ?? '') + rule);
  }
  return groups;
};

export const shareCss = (pages) => {
  const seen = new Map();
  for (const groups of pages) {
    let position = 0;
    for (const [id, css] of groups) {
      const entry = seen.get(id) ?? { css, count: 0, position: 0, same: true };
      entry.same &&= entry.css === css;
      entry.count++;
      entry.position += position++ / groups.size;
      seen.set(id, entry);
    }
  }
  const shared = [...seen]
    .filter(([id, { count, same }]) => id && same && count >= pages.length * SHARED_FROM)
    .sort(([, a], [, b]) => a.position / a.count - b.position / b.count);
  return { ids: new Set(shared.map(([id]) => id)), css: shared.map(([, { css }]) => css).join('') };
};

const main = (out) => {
  const files = fs.globSync('wiki/**/*.html', { cwd: out }).map((file) => path.join(out, file));
  const pages = files.map((file) => ({ file, html: fs.readFileSync(file, 'utf8') }))
    .map((page) => ({ ...page, match: page.html.match(STYLE) }))
    .filter(({ match }) => match)
    .map((page) => ({ file: page.file, html: page.html, match: page.match, groups: groupByClass(page.match[2]) }));
  if (!pages.length) throw new Error(`share-wiki-css: no wiki page with emotion CSS in ${out}`);

  const { ids, css } = shareCss(pages.map(({ groups }) => groups));
  const name = `wiki-${createHash('sha256').update(css).digest('hex').slice(0, 16)}.css`;
  fs.mkdirSync(path.join(out, '_next/static/css'), { recursive: true });
  fs.writeFileSync(path.join(out, '_next/static/css', name), css);

  let saved = 0;
  for (const { file, html, match, groups } of pages) {
    const rest = [...groups].filter(([id]) => !ids.has(id)).map(([, rule]) => rule).join('');
    const tags = `<link rel="stylesheet" href="/_next/static/css/${name}"/><style data-emotion="css ${match[1]}">${rest}</style>`;
    // A function, since CSS can hold `$&`, which a replacement string would expand.
    const next = html.replace(STYLE, () => tags);
    saved += html.length - next.length;
    fs.writeFileSync(file, next);
  }
  console.log(`share-wiki-css: ${pages.length} pages, ${name} ${(css.length / 1024).toFixed(1)} KB, saved ${(saved / 1e6).toFixed(1)} MB`);
};

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv[2] ?? 'out');
