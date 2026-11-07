import { expect, it } from 'vitest';
import theme from '../styles/theme/theme';

const HEADER = `/* Generated from styles/theme/theme.js: do not edit. To update it: npx vitest run __test__/theme-vars.test.js -u
   MUI would write these variables into every page's HTML, which cost 30 KB a page and took the export past GitHub Pages' 1 GB. */\n`;

const kebab = (key) => (key.startsWith('--') ? key : key.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`));
const declarations = (rules) => Object.entries(rules).map(([key, value]) => {
  if (typeof value === 'object') throw new Error(`${key} is nested: this serializer only writes flat rules`);
  return `  ${kebab(key)}: ${value};`;
}).join('\n');
const toCss = (sheets) => sheets.flatMap((sheet) => Object.entries(sheet)
  .map(([selector, rules]) => `${selector} {\n${declarations(rules)}\n}\n`)).join('');

it('the shared theme stylesheet is what the theme generates', async () => {
  await expect(`${HEADER}${toCss(theme.generateStyleSheets())}`).toMatchFileSnapshot('../styles/theme/theme-vars.css');
});
