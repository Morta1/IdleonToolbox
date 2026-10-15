// Real anchors so the exported HTML carries every link and modified clicks behave. A plain click
// still goes through the router, which keeps the session query (demo, profile) on the URL.
export const linkProps = (hrefFor, id) => {
  const href = hrefFor?.(id);
  return href ? { href } : { component: 'button', type: 'button' };
};

// Only a row that IS an anchor can be left to the browser: on the fallback button a modified click
// has nothing to open in a new tab, so bailing out would make it a dead no-op instead of a click.
export const navigateOnPlainClick = (onNavigate, id, hasHref) => (event) => {
  const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0;
  if (hasHref && modified) return;
  event.preventDefault();
  onNavigate?.(id);
};
