// The live APIs a screens route reads, served from here, so a shot shows the same rows on every run. Dates sit on the
// screens' fixed clock: 2026-11-01 12:00 UTC is the rotation that opened at the 20:00 UTC restock on 10-31. Also a kit
// setup: node tools/page-check.mjs <route> --setup e2e/live-replies.mjs
const offers = (...rows) => rows.map(([index, list, price = list]) => ({ index, list, price }));
const PET_MART_HISTORY = {
  days: [
    {
      date: '2026-10-31', shopDay: 261, source: 'live',
      base: offers([1, 3500], [46, 150], [5, 350], [16, 1200], [3, 1250]),
      plus: offers([12, 4700], [156, 500], [5, 1400, 1260], [48, 600], [29, 2700])
    },
    {
      date: '2026-10-30', shopDay: 260, source: 'live',
      base: offers([39, 2750, 2475], [17, 1150], [7, 275], [19, 550], [18, 600]),
      plus: offers([13, 3800], [111, 1200, 1020], [109, 2500], [8, 800], [21, 1500, 1350])
    },
    {
      date: '2026-10-29', shopDay: 259, source: 'live',
      base: offers([1, 3500, 2450], [7, 275], [48, 100], [17, 1150, 1035], [43, 600]),
      plus: offers([168, 4000], [48, 600], [29, 2700], [32, 2800], [50, 450, 405])
    }
  ]
};

// One curve for every row: the page reads a row by its index and ignores the rest, so a new tome row needs no edit here.
const PERCENTILE_POINTS = [1, 5, 25, 50, 75, 90, 99, 99.9];
const TOME_ROWS = 300;
const TOME_PERCENTILES = {
  percentilePoints: PERCENTILE_POINTS,
  allPlayers: Object.fromEntries(Array.from({ length: TOME_ROWS }, (_, row) => [row, PERCENTILE_POINTS.map((point) => point * (row % 5 + 1))])),
  byRank: {},
  totalPlayers: 1256,
  playersByRank: { '0.1%': 26, '1%': 260, '10%': 795, '50%': 1208 },
  rankThresholds: { '0.1%': 55385, '1%': 53349, '10%': 47297, '50%': 14425 },
  createdAt: Date.UTC(2026, 9, 31, 20)
};

const reply = (context, url, body) => context.route(url, (route) => route.fulfill({
  json: body,
  headers: { 'access-control-allow-origin': '*' }
}));

export default async function serveLiveReplies(context) {
  await reply(context, '**/api/pet-mart/history', PET_MART_HISTORY);
  await reply(context, '**/tome-percentiles', TOME_PERCENTILES);
}
