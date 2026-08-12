import { test, expect } from '@playwright/test';
import { readdirSync, statSync } from 'node:fs';
import path from 'node:path';

// Asserts on the raw served HTML, never on the rendered DOM. Every page shipped without a
// <title> for months while __test__/page-seo.test.js passed, because that test checks the
// PAGE_SEO map rather than the bytes a crawler receives. next/head silently dropped the tag.
// This spec is the output gate: it fetches each route the way Googlebot does, with no JS.

const PAGES_DIR = path.join(process.cwd(), 'pages');

const discoverRoutes = () => {
  const routes = [];
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir)) {
      const full = path.join(dir, entry);
      if (statSync(full).isDirectory()) {
        walk(full, `${prefix}/${entry}`);
        continue;
      }
      if (!entry.endsWith('.jsx')) continue;
      const name = entry.replace(/\.jsx$/, '');
      if (['_app', '_document', '_error'].includes(name)) continue;
      routes.push(name === 'index' ? (prefix || '/') : `${prefix}/${name}`);
    }
  };
  walk(PAGES_DIR);
  return routes.sort();
};

const titleOf = (html) => html.match(/<title>([^<]*)<\/title>/)?.[1];

test.describe('static export ships crawlable head tags', () => {
  for (const route of discoverRoutes()) {
    test(`${route} has a title and description in the served HTML`, async ({ request }) => {
      const response = await request.get(route);
      expect(response.status(), `${route} did not serve`).toBe(200);

      const html = await response.text();
      const occurrences = (html.match(/<title>/g) || []).length;

      expect(occurrences, `${route} must have exactly one <title>`).toBe(1);
      expect(titleOf(html)?.trim(), `${route} has an empty <title>`).toBeTruthy();
      expect(html, `${route} is missing its meta description`).toMatch(
        /<meta name="description" content="[^"]+"/
      );
    });
  }
});
