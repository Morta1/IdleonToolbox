// One clock for a whole run, for the screens and the kit (tools/page-check.mjs --clock), so two runs compare byte for byte.
// A .mjs, because plain node reads the .js files here as CommonJS.

// page.clock can't reach a Worker, so the parse worker's body gets the same time ahead of its first line.
const dateShim = (ms) => `self.Date = new Proxy(Date, {
  construct: (RealDate, args) => new RealDate(...(args.length ? args : [${ms}])),
  apply: (RealDate) => new RealDate(${ms}).toString(),
  get: (RealDate, key) => (key === 'now' ? () => ${ms} : RealDate[key])
});\n`;

// A Timer counts its own seconds on a 1 s interval, clock or no clock, so a row near a minute's edge reads another minute
// a tick later. Every other timer keeps running, so the app still works.
const holdTimerTicks = () => {
  const start = window.setInterval;
  window.setInterval = (handler, delay, ...args) => (delay === 1000 ? 0 : start(handler, delay, ...args));
};

export const fixClock = async (context, time) => {
  await context.route('**/workers/parse*.js', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, body: dateShim(new Date(time).getTime()) + await response.text() });
  });
  await context.clock.setFixedTime(time);
  // After the clock: its script replaces setInterval, and this one wraps that.
  await context.addInitScript(holdTimerTicks);
};
