// Entity names are stored the way the game stores them, with underscores for spaces. Kept out of
// the panel component so getStaticProps and the SEO helpers can read it without pulling MUI into
// the build graph. An .mjs because field-links.mjs, which the Node build imports, names link targets with it.
export const entityName = (node) => (node?.name || node?.rawName || '').replace(/_/g, ' ');

// A stable, lowercase URL segment per entity, so /wiki/monster/sand-giant addresses what ?e= used
// to. Lowercase by construction: the static export writes one file per page, and a local export on
// a case-insensitive filesystem would collapse two slugs differing only in case (the same trap
// /tools/builds/[slug] hit).
export const slugify = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');
