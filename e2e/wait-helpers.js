// A route that loads too slowly makes Next navigate the hard way (route-loader's timeout, which a cold worker on a busy
// machine reaches), so the page can be mid-load at any read here, with no body yet or with the read cut off by the load.
const readPage = (page) => page.evaluate(() => ({
  settled: document.readyState !== 'loading' && !document.querySelector('[data-testid="page-loader"]'),
  length: document.body?.innerText.length ?? 0
})).catch(() => ({ settled: false, length: 0 }));

// Two equal reads past the loader: a page that brings its loader back starts over, and the loader's own text never counts.
export const waitForRender = async (page, maxMs = 15_000) => {
  const deadline = Date.now() + maxMs;
  let previous = null;
  while (Date.now() < deadline) {
    const { settled, length } = await readPage(page);
    if (settled && length > 0 && length === previous) return;
    previous = settled ? length : null;
    await page.waitForTimeout(200);
  }
  throw new Error(`page never stopped rendering within ${maxMs}ms - the scan below would have read a half-built DOM`);
};

// A tab strip scrolls to its selected tab on its own frames and its arrows follow, after the text has settled: a shot in
// between differs by a few pixels. An arrow rests at 0, or at MUI's 0.8, so it counts as settled once it stops changing.
export const settleStrips = async (page, maxMs = 5_000) => {
  const deadline = Date.now() + maxMs;
  let previous = null;
  while (Date.now() < deadline) {
    const strips = await page.evaluate(() => JSON.stringify([
      [...document.querySelectorAll('.MuiTabs-scroller')].map((scroller) => scroller.scrollLeft),
      [...document.querySelectorAll('.MuiTabScrollButton-root')].map((arrow) => getComputedStyle(arrow).opacity)
    ]));
    if (strips === previous) return;
    previous = strips;
    await page.waitForTimeout(150);
  }
};
