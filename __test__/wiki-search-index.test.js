import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const indexPath = path.join(__dirname, '..', 'data', 'wiki-search-index.json');

describe('wiki search index', () => {
  it('exists and is a non-trivial array', () => {
    expect(fs.existsSync(indexPath)).toBe(true);
    const entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(3000);
  });

  it('every entry carries id, kind, label and slug; icon is a rooted path or null', () => {
    const entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    for (const entry of entries) {
      expect(typeof entry.id).toBe('string');
      expect(typeof entry.kind).toBe('string');
      expect(typeof entry.label).toBe('string');
      expect(entry.label).not.toContain('_');
      expect(typeof entry.slug).toBe('string');
      expect(entry.icon === null || entry.icon.startsWith('/')).toBe(true);
    }
  });

  it('contains a known monster with its per-entity icon', () => {
    const entries = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));
    const bean = entries.find((entry) => entry.label === 'Bored Bean');
    expect(bean).toMatchObject({ kind: 'monster', slug: 'bored-bean', icon: '/monsters/beanG/static.png' });
  });
});
