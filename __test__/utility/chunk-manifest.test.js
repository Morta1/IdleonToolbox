import { describe, it, expect } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseChunkRefs, buildManifest } from '@utility/chunk-manifest.mjs';

describe('parseChunkRefs', () => {
  it('pulls chunk basenames out of script src attributes', () => {
    const html = '<script src="/_next/static/chunks/3hfc-ch9u_y9d.js"></script>';
    expect(parseChunkRefs(html)).toEqual(['3hfc-ch9u_y9d.js']);
  });

  // Next inlines the same chunk list a second time inside __NEXT_DATA__, so a naive
  // scan double-counts every chunk and doubles every page's reported bytes.
  it('deduplicates a chunk referenced more than once', () => {
    const html = '<script src="/_next/static/chunks/a.js"></script>'
      + '<script>{"chunks":["static/chunks/a.js"]}</script>';
    expect(parseChunkRefs(html)).toEqual(['a.js']);
  });

  it('ignores non-chunk scripts', () => {
    expect(parseChunkRefs('<script src="/_next/static/css/x.css"></script>')).toEqual([]);
  });

  it('returns an empty array for a page with no scripts', () => {
    expect(parseChunkRefs('<html><body>hi</body></html>')).toEqual([]);
  });
});

describe('buildManifest', () => {
  const withOut = () => {
    const root = mkdtempSync(path.join(tmpdir(), 'manifest-'));
    const chunks = path.join(root, '_next', 'static', 'chunks');
    mkdirSync(chunks, { recursive: true });
    writeFileSync(path.join(chunks, 'big.js'), 'x'.repeat(1000));
    writeFileSync(path.join(chunks, 'small.js'), 'x'.repeat(10));
    mkdirSync(path.join(root, 'account'), { recursive: true });
    writeFileSync(path.join(root, 'index.html'),
      '<script src="/_next/static/chunks/small.js"></script>');
    writeFileSync(path.join(root, 'account', 'research.html'),
      '<script src="/_next/static/chunks/big.js"></script>');
    return root;
  };

  it('reports every page with its chunk bytes, heaviest first', () => {
    const rows = buildManifest(withOut());
    expect(rows).toEqual([
      { page: 'account/research.html', chunks: ['big.js'], bytes: 1000 },
      { page: 'index.html', chunks: ['small.js'], bytes: 10 }
    ]);
  });

  // A chunk named in the HTML but absent on disk must not crash the run or silently
  // count as zero without a trace.
  it('counts a missing chunk as zero bytes and still lists it', () => {
    const root = withOut();
    writeFileSync(path.join(root, 'ghost.html'),
      '<script src="/_next/static/chunks/nope.js"></script>');
    const row = buildManifest(root).find((r) => r.page === 'ghost.html');
    expect(row).toEqual({ page: 'ghost.html', chunks: ['nope.js'], bytes: 0 });
  });

  it('returns an empty array when out/ does not exist', () => {
    expect(buildManifest(path.join(tmpdir(), 'no-such-out'))).toEqual([]);
  });
});
