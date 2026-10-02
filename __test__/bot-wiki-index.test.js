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

  it('contains Golden Jam with its sources', () => {
    const jam = entries.find((entry) => entry.id === 'item:FoodG1');
    expect(jam).toMatchObject({ label: 'Golden Jam', kindLabel: 'Item', slug: 'golden-jam', listed: true });
    expect(jam.sources.find((source) => source.label === 'Dropped by')?.count).toBeGreaterThan(0);
  });

  it('gives Void Card its effect and names its source', () => {
    const card = entries.find((entry) => entry.id === 'item:CardsD3');
    expect(card.effect).toContain('Mining Efficiency');
    expect(card.sources.find((source) => source.label === 'Dropped by')?.names).toEqual(['Void']);
  });

  it('stays small enough to bundle', () => {
    expect(fs.statSync(indexPath).size).toBeLessThan(3_000_000);
  });
});
