// Client-side equivalent of the Worker's list query, for the generated class pages.
//
// Those pages already hold every build for their class in static props (the largest class has
// well under a hundred), so filtering in memory keeps them working with no API round-trip and
// no cursor paging. The hub still queries the Worker, because it pages over all builds.
//
// Semantics deliberately mirror src/routes/list.ts so the two pages behave the same:
//   tags  -> a build must carry ALL selected tags ($all, not $in)
//   sort  -> 'new' is createdAt desc, 'top' is likeCount desc
//   q     -> the Worker runs a Mongo $text index over title + description; the list projection
//            has no description, so this matches the title only. Narrower, never wider.

const byNewest = (a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
const byLikes = (a, b) => (b.likeCount || 0) - (a.likeCount || 0) || byNewest(a, b);

export const filterAndSortBuilds = (builds, filters = {}, options = {}) => {
  const tags = filters.tags || [];
  const q = (filters.q || '').trim().toLowerCase();
  const { pinFirst } = options;

  const matches = (build) => {
    if (tags.length && !tags.every((tag) => build?.tags?.includes(tag))) return false;
    // The Worker ignores a single-character search; match that rather than filtering the page
    // down to nothing on the first keystroke.
    if (q.length > 1 && !String(build?.title || '').toLowerCase().includes(q)) return false;
    return true;
  };

  const comparator = filters.sort === 'top' ? byLikes : byNewest;
  // Builds already on the page (static props) sort ahead of ones fetched after the export, in
  // every sort mode, or a newer fetched build outranks them and shifts the grid after first paint.
  const withPin = pinFirst
    ? (a, b) => (pinFirst.has(a.shortId) ? 0 : 1) - (pinFirst.has(b.shortId) ? 0 : 1) || comparator(a, b)
    : comparator;

  return (builds || [])
    .filter(matches)
    .sort(withPin);
};
