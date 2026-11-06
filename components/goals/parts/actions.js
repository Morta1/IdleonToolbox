import { cleanUnderscore } from '@utility/helpers';
import { sessionQuery } from '@utility/nav-query';
import { trackEvent } from '@utility/analytics';
import { getDescriptor } from '@utility/goals/registry';
import { openWikiEntity } from '@utility/wiki/item-page';
import { goalTitle } from './format';

// The wiki page of one entry, for systems whose entries have one
export const entryWikiOpener = (system, key) => {
  const wikiId = getDescriptor(system)?.wikiId;
  return wikiId && key ? () => openWikiEntity(wikiId(key)) : null;
};

// What a goal row and a goal card both offer: the goals Edit can open (a range edits either of its two), the page
// link and its label, and the entry's wiki page
export const goalActions = (view, query) => {
  const missing = view.status === 'missing';
  return {
    editable: view.range ? [view.range.lower, view.range.upper] : [view],
    route: !missing && view.route ? { pathname: view.route, query: sessionQuery(query) } : null,
    openLabel: `Open ${view.label} page`,
    onOpenPage: () => trackEvent('goal_click', { system: view.system, kind: view.kind }),
    onOpenWiki: !missing && view.kind === 'entry' ? entryWikiOpener(view.system, view.key) : null
  };
};

// A goal gone from the game has only what it stored: its key made readable, its kind beside it ("Stamp Z99 · Stamps")
const readableKey = (key) => cleanUnderscore(key).replace(/([a-z])([A-Z])/g, '$1 $2');
export const displayTitle = (view) => ((view.status === 'missing' || view.status === 'unread') && !view.icon
  ? (view.kind === 'all' ? view.name : `${readableKey(view.name)} · ${view.label}`)
  : goalTitle(view));
