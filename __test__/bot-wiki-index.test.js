import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const indexPath = path.join(__dirname, '..', 'data', 'bot-wiki-index.json');
const searchPath = path.join(__dirname, '..', 'data', 'wiki-search-index.json');

describe('bot wiki index', () => {
  const entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

  it('has one entry per search index entry', () => {
    const search = JSON.parse(fs.readFileSync(searchPath, 'utf-8'));
    expect(entries.length).toBe(search.length);
  });

  it('stays small enough to bundle', () => {
    expect(fs.statSync(indexPath).size).toBeLessThan(3_000_000);
  });
});
