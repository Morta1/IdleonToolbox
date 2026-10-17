import { entityHref } from './page-graph';

// The wiki page of an entity by its graph id (item:<rawName>, constellation:<name>). Item names collide (79 of them), so the slug cannot be built from the
// display name: it is looked up in the wiki's own search index, loaded only when a link is followed so the account
// pages do not ship it. The tab opens inside the click (a window.open after an await is a blocked popup) and is
// pointed at the page once the lookup lands.
export const openWikiEntity = (entityId) => {
  if (!entityId) return;
  const tab = window.open('', '_blank');
  if (!tab) return;
  tab.opener = null;
  import('../../data/wiki-search-index.json').then(({ default: entries }) => {
    const href = entityHref(entries.find(({ id }) => id === entityId));
    if (href) tab.location.href = href;
    else tab.close();
  }).catch(() => tab.close());
};

export const openItemWikiPage = (rawName) => openWikiEntity(rawName ? `item:${rawName}` : null);
