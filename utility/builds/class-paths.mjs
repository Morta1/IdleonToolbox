// Routing helpers for /tools/builds/[class].
//
// Dependency-free ESM on purpose — utility/generate-sitemap.mjs imports this
// and is a plain Node script that cannot resolve Next aliases or TypeScript.
//
// BUILD_FAMILIES mirrors FAMILY_ORDER in utility/builds/classes.js. It is
// duplicated rather than imported because that module reaches into
// parsers/talents.ts. These four families are fixed game concepts.

export const BUILD_FAMILIES = ['Beginner', 'Warrior', 'Archer', 'Mage'];

const FAMILY_SLUGS = BUILD_FAMILIES.map((f) => f.toLowerCase());

export const classToSlug = (name) => String(name).toLowerCase().replace(/_/g, '-');

export const slugToDisplayName = (slug) =>
  String(slug)
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

export const isFamilySlug = (slug) => FAMILY_SLUGS.includes(slug);

// A subclass slug becomes a getStaticPaths param — a filesystem path segment
// under output: 'export' — and is later interpolated unescaped into
// sitemap.xml <loc> entries. `subclass` comes straight from the API, so
// anything containing '/', '..', '&', '<' etc. must be rejected before it
// reaches either the filesystem or the XML, rather than merely lowercased.
const VALID_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

// Families always get a page so they can act as the catch-all for subclasses
// with no builds. Subclasses get a page if they have at least one build and
// their slug is well-formed.
export function getBuildClassSlugs(builds) {
  const slugs = new Set(FAMILY_SLUGS);
  for (const build of builds || []) {
    if (!build?.subclass) continue;
    const slug = classToSlug(build.subclass);
    if (VALID_SLUG.test(slug)) slugs.add(slug);
  }
  return [...slugs];
}

export function buildsForSlug(builds, slug) {
  const list = builds || [];
  if (isFamilySlug(slug)) {
    return list.filter((build) => classToSlug(build?.class) === slug);
  }
  return list.filter((build) => build?.subclass && classToSlug(build.subclass) === slug);
}
