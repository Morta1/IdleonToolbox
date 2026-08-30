// The same per-entity history read the other way round: by version rather than by entity. Kept
// out of the page so the grouping can be tested without rendering MUI.

// "2.3.100" sorts before "2.3.50" as a string. Newest first, so the comparison is reversed.
const compareVersionsDesc = (a, b) => {
  const parts = (v) => v.split('.').map((n) => parseInt(n, 10) || 0);
  const [a1, a2, a3] = parts(a), [b1, b2, b3] = parts(b);
  return b1 - a1 || b2 - a2 || b3 - a3 || b.localeCompare(a);
};

export const rollupByVersion = (nodes) => {
  const versions = new Map();

  for (const node of Object.values(nodes || {})) {
    for (const event of node.history || []) {
      if (!versions.has(event.v)) versions.set(event.v, { version: event.v, added: 0, changed: 0, byKind: new Map() });
      const row = versions.get(event.v);
      if (event.t === 'added') row.added += 1; else row.changed += 1;
      if (!row.byKind.has(node.kind)) row.byKind.set(node.kind, []);
      row.byKind.get(node.kind).push({
        name: node.name,
        slug: node.slug,
        kind: node.kind,
        added: event.t === 'added',
        fields: event.fields || []
      });
    }
  }

  return [...versions.values()]
    .sort((a, b) => compareVersionsDesc(a.version, b.version))
    .map(({ version, added, changed, byKind }) => ({
      version,
      added,
      changed,
      kinds: [...byKind.entries()]
        .map(([kind, entries]) => ({ kind, entries: entries.sort((a, b) => String(a.name).localeCompare(String(b.name))) }))
        .sort((a, b) => a.kind.localeCompare(b.kind))
    }));
};
