// A stable, lowercase URL segment per entity, so /wiki/monster/sand-giant addresses what ?e= used
// to. Lowercase by construction: the static export writes one file per page, and a local export on
// a case-insensitive filesystem would collapse two slugs differing only in case (the same trap
// /tools/builds/[slug] hit).
export const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

// Names are not unique: The Crow Perch is both a hat and a dungeon hat, and 79 item names collide
// like that. A colliding name disambiguates with the rawName, which IS unique because it keys the
// node. Every member of a colliding group takes the suffix, not just the losers, so the slug never
// depends on iteration order and cannot shuffle between builds.
export const assignSlugs = (nodes) => {
  const claims = new Map();
  for (const [id, node] of Object.entries(nodes)) {
    const key = `${node.kind}/${slugify(node.name || node.rawName)}`;
    if (!claims.has(key)) claims.set(key, []);
    claims.get(key).push(id);
  }

  for (const [key, ids] of claims) {
    const base = key.slice(key.indexOf('/') + 1);
    for (const id of ids) {
      const node = nodes[id];
      // An empty base means a name of pure punctuation; the rawName is all there is to go on.
      const raw = slugify(node.rawName);
      node.slug = ids.length === 1 && base ? base : [base, raw].filter(Boolean).join('--');
    }
  }
  return nodes;
};
