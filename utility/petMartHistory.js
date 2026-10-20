import { getNextPetMartRestock } from './helpers';

const DAY_MS = 24 * 60 * 60 * 1000;

// The UTC date of the 20:00 UTC restock that opened the rotation live at `now`: the worker files
// each rotation under the same date, so the two always agree.
export const getPetMartRotationDate = (now) => new Date(getNextPetMartRestock(now) - DAY_MS).toISOString().slice(0, 10);

const byNewest = (a, b) => (b.date === a.date ? (b.shopDay ?? 0) - (a.shopDay ?? 0) : b.date < a.date ? -1 : 1);

// The worker's recorded days plus today's stock from the account. The account's copy of the
// rotation can be ahead of the worker (its cron runs hourly), so it is added when it is newer than
// every shop day the worker logged. Only then is it today's: a demo or an old profile carries a
// rotation from weeks ago, and dating that "today" would bury the real day.
export const mergePetMartHistory = (days, petMart, now) => {
  const merged = Array.isArray(days) ? [...days] : [];
  const shopDay = petMart?.shopDay;
  const hasStock = petMart?.offers?.length || petMart?.plusOffers?.length;
  const lastLogged = Math.max(-Infinity, ...merged.map((day) => day.shopDay ?? -Infinity));
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
  return merged.sort(byNewest);
};

// Companion index -> the last date it was on one counter ('plus' or 'base').
export const getPetMartLastSeen = (history, counter) => {
  const lastSeen = new Map();
  for (const day of history ?? []) {
    for (const offer of day[counter] ?? []) {
      if (!lastSeen.has(offer.index) || day.date > lastSeen.get(offer.index)) lastSeen.set(offer.index, day.date);
    }
  }
  return lastSeen;
};

// Sort key for "Last in the Pet Mart": ascending puts never-seen pets first and today's offers last.
export const lastInPetMartKey = (lastSeen, inToday) => {
  if (inToday) return '9999-12-31';
  return lastSeen ?? '';
};
