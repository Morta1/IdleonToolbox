// A constellation sits on one area, and the area page lists the constellations on it. No existing
// relation fits: `hosts` is an area's NPCs, and reusing it would put a constellation under the
// area's NPC heading.
export const constellationEdges = (constellations) => (constellations || [])
  .filter((entry) => entry?.name && entry.mapIndex != null)
  .map((entry) => ({
    from: `constellation:${entry.name}`,
    to: `map:${entry.mapIndex}`,
    rel: 'locatedIn',
    meta: {},
    source: 'catalogs-a'
  }));
