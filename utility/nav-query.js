// Which query params survive an in-app navigation.
//
// Every nav link used to carry the whole query forward minus the tab params, which meant any param
// the visitor arrived with rode along to every page after it: a build `slug` ended up on the god
// planner, `c`/`b` on the guilds page, and the 404's `reason`/`name` on the leaderboards. Each
// combination is a distinct URL, and Search Console picked up ~1,900 of them as duplicates of the
// clean page.
//
// An allowlist rather than a denylist: a param earns a place here only by identifying *which save*
// is being viewed, so it has to survive the hop or the target page loses the session. Anything
// else describes the page being left, not the one being opened.
export const SESSION_QUERY_PARAMS = ['profile', 'demo'];

export const sessionQuery = (query) => SESSION_QUERY_PARAMS.reduce((acc, key) => {
  if (query?.[key] != null) {
    acc[key] = query[key];
  }
  return acc;
}, {});

// Leaving a profile view for your own account: same session params, minus the profile itself.
export const sessionQueryWithoutProfile = (query) => {
  const { profile, ...rest } = sessionQuery(query);
  return rest;
};
