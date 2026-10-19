import { getNextPetMartRestock } from './helpers';

const DAY_MS = 24 * 60 * 60 * 1000;

// The UTC date of the 20:00 UTC restock that opened the rotation live at `now`: the worker files
// each rotation under the same date, so the two always agree.
export const getPetMartRotationDate = (now) => new Date(getNextPetMartRestock(now) - DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (fromDate, toDate) => Math.round((Date.parse(toDate) - Date.parse(fromDate)) / DAY_MS);

const byNewest = (a, b) => (b.date === a.date ? (b.shopDay ?? 0) - (a.shopDay ?? 0) : b.date < a.date ? -1 : 1);

// The worker's recorded days plus today's stock from the account. The account's copy of the
// rotation can be ahead of the worker (its cron runs hourly), so it is added when it is newer than
// every shop day the worker logged. Only then is it today's: a demo or an old profile carries a
// rotation from weeks ago, and dating that "today" would bury the real day. A wiki row gives way
// to a live row on the same date: the live one has the full rotation with prices.
export const mergePetMartHistory = (days, petMart, now) => {
  let merged = Array.isArray(days) ? [...days] : [];
  const shopDay = petMart?.shopDay;
  const hasStock = petMart?.offers?.length || petMart?.plusOffers?.length;
  const lastLogged = Math.max(-Infinity, ...merged.filter((day) => day.source === 'live').map((day) => day.shopDay));
  if (shopDay >= 1 && hasStock && Number.isFinite(lastLogged) && shopDay > lastLogged) {
    const toOffer = (offer) => ({ index: offer.companionIndex, list: offer.listPrice, price: offer.price });
    merged.push({
      date: getPetMartRotationDate(now),
      shopDay,
      source: 'live',
      base: (petMart.offers ?? []).map(toOffer),
      plus: (petMart.plusOffers ?? []).map(toOffer)
    });
  }
  const liveDates = new Set(merged.filter((day) => day.source === 'live').map((day) => day.date));
  merged = merged.filter((day) => day.source !== 'wiki' || !liveDates.has(day.date));
  return merged.sort(byNewest);
};

// Per companion index, for one counter ('plus' or 'base'): the first date it was seen, and the
// last date a live row saw it. A wiki row only records a pet's first appearance, so it can never
// say when the pet was last sold.
export const getPetMartStats = (history, counter) => {
  const stats = new Map();
  for (const day of history ?? []) {
    for (const offer of day[counter] ?? []) {
      const entry = stats.get(offer.index) ?? { firstSeen: day.date, lastSold: null };
      if (day.date < entry.firstSeen) entry.firstSeen = day.date;
      if (day.source === 'live' && (!entry.lastSold || day.date > entry.lastSold)) entry.lastSold = day.date;
      stats.set(offer.index, entry);
    }
  }
  return stats;
};

// The oldest date the history covers: "not seen since" is only as long as the record.
export const getPetMartHistoryStart = (history) => history?.length ? history.at(-1).date : null;

// Sort key for "longest since sold": never-seen pets first, then the oldest known sale. A pet the
// wiki saw but no live row has yet sorts by its first appearance, the only date known for it.
export const longestSinceSoldKey = (stat, inToday) => {
  if (inToday) return '9999-12-31';
  if (!stat) return '';
  return stat.lastSold ?? stat.firstSeen;
};
