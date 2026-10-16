import { useRouter } from 'next/router';
import { sessionQuery } from '@utility/nav-query';

// Real anchors so the exported HTML carries every link and modified clicks behave. A plain click
// still goes through the router, which keeps the session query (demo, profile) on the URL.
export const linkProps = (hrefFor, id) => {
  const href = hrefFor?.(id);
  return href ? { href } : { component: 'button', type: 'button' };
};

// Ctrl, cmd, shift, alt and middle-click belong to the browser: a new tab or window, not an in-app hop.
export const isModifiedClick = (event) => event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
  || event.button !== 0;

// Only a row that IS an anchor can be left to the browser: on the fallback button a modified click
// has nothing to open in a new tab, so bailing out would make it a dead no-op instead of a click.
// With no handler an anchor is left to the browser too, rather than swallowing the click.
export const navigateOnPlainClick = (onNavigate, id, hasHref) => (event) => {
  if (hasHref && (isModifiedClick(event) || !onNavigate)) return;
  event.preventDefault();
  onNavigate?.(id);
};

// The in-app hop every wiki page makes: push the href and keep the session query (demo, profile) on the URL.
export const useWikiGo = () => {
  const router = useRouter();
  return (href) => router.push({ pathname: href, query: sessionQuery(router.query) });
};

// The (event, href) form a row of anchors wants: a plain click goes through `onGo`, a modified one is the browser's.
export const goOnPlainClick = (onGo) => (event, href) => navigateOnPlainClick(onGo, href, true)(event);
