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
