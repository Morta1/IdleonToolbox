// Client for it-cloudflare-builds. Mirrors services/profiles.js in style —
// each function optionally takes a `token` (Firebase JWT) that the Worker uses
// to identify the caller for writes and private reads.

const url = process.env.NEXT_PUBLIC_BUILDS_URL;

const authHeaders = (token) => ({
  'Content-Type': 'application/json',
  ...(token ? { Authorization: token } : {})
});

const parseError = async (response) => {
  try {
    const body = await response.json();
    return body?.error || `HTTP ${response.status}`;
  } catch {
    return `HTTP ${response.status}`;
  }
};

const request = async (path, { method = 'GET', body, token, signal } = {}) => {
  const response = await fetch(`${url}${path}`, {
    method,
    headers: authHeaders(token),
    body: body != null ? JSON.stringify(body) : undefined,
    signal
  });
  if (!response.ok) {
    const msg = await parseError(response);
    const err = new Error(msg);
    err.status = response.status;
    throw err;
  }
  if (response.status === 204) return null;
  return await response.json();
};

// ---------- Public reads ----------

export const listBuilds = async ({
  className,
  subclass,
  sort,
  tag,
  q,
  cursor,
  limit = 20
} = {}) => {
  const params = new URLSearchParams();
  if (className) params.set('class', className);
  if (subclass) params.set('subclass', subclass);
  if (sort) params.set('sort', sort);
  if (tag) params.set('tag', Array.isArray(tag) ? tag.join(',') : tag);
  if (q) params.set('q', q);
  if (cursor) params.set('cursor', cursor);
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  return request(`/builds${qs ? `?${qs}` : ''}`);
};

export const getBuild = async (shortId) => {
  return request(`/builds/${encodeURIComponent(shortId)}`);
};

// ---------- Authenticated writes ----------

export const createBuild = async (build, token) => {
  return request('/builds', { method: 'POST', body: build, token });
};

export const updateBuild = async (shortId, build, token) => {
  return request(`/builds/${encodeURIComponent(shortId)}`, {
    method: 'PUT',
    body: build,
    token
  });
};

export const deleteBuild = async (shortId, token) => {
  return request(`/builds/${encodeURIComponent(shortId)}`, {
    method: 'DELETE',
    token
  });
};

export const setLike = async (shortId, liked, token) => {
  return request(`/builds/${encodeURIComponent(shortId)}/like`, {
    method: 'POST',
    body: { liked: !!liked },
    token
  });
};

// ---------- Authenticated reads ----------

export const listMyBuilds = async (token) => {
  return request('/builds/my-builds', { token });
};

export const listLikedBuilds = async (token) => {
  return request('/builds/liked', { token });
};

// Cheap per-(build, viewer) lookup: { liked, owner }. Used by the detail page
// to decide whether to show the filled heart + edit/delete actions without
// refetching the full /my-builds and /liked lists.
export const getBuildState = async (shortId, token) => {
  return request(`/builds/${encodeURIComponent(shortId)}/me`, { token });
};
