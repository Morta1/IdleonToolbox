// Slugs, hrefs and metadata for /tools/builds/<slug>.
//
// Dependency-free ESM on purpose — utility/generate-sitemap.mjs imports this and is a plain
// Node script that cannot resolve Next aliases or TypeScript.

const MAX_TITLE_SLUG = 60;

export const titleSlug = (title) =>
  String(title || '')
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_TITLE_SLUG)
    .replace(/-+$/, '');

// The shortId is lowercased because output: 'export' writes one file per slug and local exports
// run on a case-insensitive filesystem, where 'frZFgN-x' and 'FRzfGn-x' would overwrite each
// other while staying distinct on GitHub Pages. The title suffix is never omitted: a shortId
// that happened to spell a class name would otherwise produce that class page's URL.
export const buildToSlug = (build) => {
  const id = String(build?.shortId || '').toLowerCase();
  const rest = titleSlug(build?.title);
  return rest ? `${id}-${rest}` : `${id}-build`;
};

export const buildStaticHref = (build) => `/tools/builds/${buildToSlug(build)}`;

export const staticIdSet = (builds) =>
  new Set((builds || []).map((b) => String(b?.shortId || '').toLowerCase()));

// A build published after the last deploy has no exported page — fallback: false makes that a
// hard 404 — so it keeps the runtime route instead.
export const buildHref = (build, staticIds) =>
  staticIds?.has(String(build?.shortId || '').toLowerCase())
    ? buildStaticHref(build)
    : `/tools/builds/view?id=${build?.shortId}`;

// Two entries claiming one path means one page silently replaces the other in out/. Fail the
// build rather than deploy whichever won.
export function assertNoSlugCollisions(classSlugs, buildSlugs) {
  const seen = new Set(classSlugs);
  const clashes = [];
  for (const slug of buildSlugs) {
    if (seen.has(slug)) clashes.push(slug);
    seen.add(slug);
  }
  if (clashes.length) {
    throw new Error(
      `Build slugs collide with an existing page path: ${[...new Set(clashes)].join(', ')}`
    );
  }
}

// -- Crawlable link lists ----------------------------------------------------
//
// Rendered above the router gate (components/common/CrawlLinks.jsx), which is the only way a
// link reaches the exported HTML. Short keys because this ships in __NEXT_DATA__ on every page
// that has one.
//
// Known gap: fetchAllBuildsAtBuildTime memoises per process, and Next forks workers for static
// generation, so a page's getStaticProps can see a build that getStaticPaths never exported a
// page for. The sitemap defends against this (pruneUnexportedBuilds); these links cannot, because
// they are baked in before out/ exists. The window is one build published mid-build, and the next
// deploy clears it.

export const buildCrawlLink = (build) => ({
  h: buildStaticHref(build),
  t: `${(build.subclass || build.class || '').replace(/_/g, ' ')} — ${build.title}`
});

export const classCrawlLink = (slug, label) => ({ h: `/tools/builds/${slug}`, t: label });

// -- Metadata ----------------------------------------------------------------

export function toBuildSummary(build) {
  return {
    shortId: build.shortId,
    title: build.title,
    class: build.class,
    subclass: build.subclass,
    ownerName: build.ownerName,
    tags: build.tags,
    likeCount: build.likeCount
  };
}

export function findInManifest(manifest, shortId) {
  if (!shortId) return null;
  return (manifest || []).find((entry) => entry.shortId === shortId) || null;
}

// The subclass alone, not "Barbarian Warrior" — the family adds no search value and produces
// nonsense like "Journeyman Beginner". Falls back to the family for builds with no subclass.
const classLabel = (summary) => (summary.subclass || summary.class || '').replace(/_/g, ' ');

// Class first, user title second. Build titles are free text and frequently useless as keywords
// ("Laealwaysforgets 2", "The build thus far.."); leading with them pushed the term the page
// actually targets past Google's ~60-char cutoff on 52 of 111 builds.
export function buildSeoTitle(summary) {
  if (!summary) return 'Build | Idleon Toolbox';
  return `${classLabel(summary)} Build — ${summary.title} | Idleon Toolbox`;
}

export function buildSeoDescription(summary) {
  if (!summary) return 'Community build for Legends of Idleon';
  const tags = (summary.tags || []).join(', ');
  const tagPart = tags ? ` — ${tags}.` : '.';
  return `${summary.title} by ${summary.ownerName}. ${classLabel(summary)} build for Legends of Idleon${tagPart} ${summary.likeCount || 0} likes.`;
}
