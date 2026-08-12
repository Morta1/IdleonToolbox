/**
 * Waits for a page to finish rendering, in two steps: the loader is gone, then the rendered text
 * stops changing (React renders in more than one pass, so "loader gone" alone is too early).
 *
 * Replaces `waitForLoadState('networkidle')`, which the site's ad and identity scripts made
 * unreliable - `api.rlcdn.com` fails CORS and never settles, so "the network went quiet" was a race
 * rather than a fact about the page.
 *
 * A timeout throws rather than returning quietly: a page scanned half-built passes a
 * "renders no NaN" gate on the strength of content that has not appeared yet.
 */
export const waitForRender = async (page, maxMs = 15_000) => {
  const deadline = Date.now() + maxMs;
  await page
    .waitForFunction(() => !document.querySelector('[data-testid="page-loader"]'), null, { timeout: maxMs })
    .catch(() => {});

  let previous = null;
  while (Date.now() < deadline) {
    const length = await page.evaluate(() => document.body.innerText.length);
    if (length > 0 && length === previous) return;
    previous = length;
    await page.waitForTimeout(200);
  }
  throw new Error(`page never stopped rendering within ${maxMs}ms - the scan below would have read a half-built DOM`);
};
