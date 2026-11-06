#!/usr/bin/env node
// One hand check instead of a new script per task: opens routes at sizes and states, saves shots and a text dump, and
// scans the DOM for what walks keep finding by eye. Screens can't see these: they shoot 1920 and 384 at the top of the page.
//
//   node tools/page-check.mjs /wiki/bubble /guilds --sizes 900,1366 --states guest --out <dir>
//   node tools/page-check.mjs /account/world-4/lab --force lab --no-shots
//
// --sizes    widths, or WIDTHxHEIGHT; under 768 gets touch. Default 1920,1366,900,384.
// --states   demo, guest. Default both.
// --schemes  dark, light. Default dark. A light run's files end in -light.
// --force    safeSection names that really throw in the parse Worker: farming,hole. * fails the whole parse. A guest's parse fails the same way.
// --setup    a module whose default export takes the browser context, for serving API replies with context.route.
//            e2e/live-replies.mjs serves fixed rows; e2e/live-proxy.mjs adds the site's own APIs, which refuse localhost.
// --storage  JSON of localStorage entries.
// --settle   more ms after the page settles: a tool page's text stands still before its parse lands.
// --click    a selector clicked once the page has rendered, before the scan: a drawer or a note that only opens on a tap.
//            The first match. Its text joins the dump, and the shots catch it open.
// --clock    an ISO time that the page and the parse Worker read as now, so two runs an hour apart compare with `diff -r`.
// --base     default http://localhost:$E2E_PORT, or 3002.
// --no-shots scan only. --out default .page-check (gitignored). Exit 1 on any hit, 2 when the server is down.
//
// Each route and state gets a <slug>.png sheet of its sizes; originals and the .txt dumps sit beside it, so two runs
// compare with `diff -r`. A dump leaves out [data-volatile], the page's live numbers. A hit is a lead to look at, not a verdict: the owner's rule is still the shot beside its board.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseArgs } from 'node:util';
import { fixClock } from '../e2e/fixed-clock.mjs';

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    sizes: { type: 'string', default: '1920,1366,900,384' },
    states: { type: 'string', default: 'demo,guest' },
    schemes: { type: 'string', default: 'dark' },
    force: { type: 'string' },
    setup: { type: 'string' },
    storage: { type: 'string' },
    settle: { type: 'string', default: '0' },
    click: { type: 'string' },
    clock: { type: 'string' },
    base: { type: 'string', default: `http://localhost:${process.env.E2E_PORT ?? 3002}` },
    out: { type: 'string', default: '.page-check' },
    'no-shots': { type: 'boolean', default: false },
    workers: { type: 'string', default: '3' },
    'max-lines': { type: 'string', default: '6' },
    'min-gap': { type: 'string', default: '3' }
  }
});

// Git Bash rewrites a leading /route into its install folder.
const routes = positionals.map((route) => route.replace(/^[A-Za-z]:\/Program Files\/Git/, '') || '/');
const HEIGHTS = { 1920: 950, 1536: 730, 1366: 768, 1024: 768, 900: 800, 384: 832, 320: 700 };
const MAX_SHOT_HEIGHT = 4000;
const PHONE_SHOTS = 4;
const MAX_LOW_CONTRAST = 40;
const AD_NOISE = /rlcdn|Failed to load resource|nitro|googletag|gtag|adsbygoogle|doubleclick/i;
// What --force asked for, logged by the parse on every pass: a real failure beside it still reports.
const FORCED_LOG = /Error: forced: /;

const sizes = opts.sizes.split(',').map((text) => {
  const [width, height] = text.split('x').map(Number);
  return { width, height: height || HEIGHTS[width] || 800 };
});
const states = opts.states.split(',');
const schemes = opts.schemes.split(',');
const force = opts.force?.split(',');
const storage = opts.storage ? JSON.parse(opts.storage) : null;
const setup = opts.setup ? (await import(pathToFileURL(resolve(opts.setup)).href)).default : null;
const consent = {
  cookies: [{ name: 'idleon-consent', value: 'false', domain: 'localhost', path: '/', expires: -1, httpOnly: false, secure: false, sameSite: 'Lax' }],
  origins: []
};

// parseData's options sit at args[7] (parsers/index.ts): failSections makes those safeSections throw inside the parse.
const forceSections = (names) => {
  const post = Worker.prototype.postMessage;
  Worker.prototype.postMessage = function postWithFailures(message, ...rest) {
    if (Array.isArray(message?.args)) message.args[7] = { ...message.args[7], failSections: names };
    return post.call(this, message, ...rest);
  };
};

const waitForRender = async (page, maxMs = 20000) => {
  const deadline = Date.now() + maxMs;
  await page.waitForFunction(() => !document.querySelector('[data-testid="page-loader"]'), null, { timeout: maxMs }).catch(() => {});
  let previous = null;
  while (Date.now() < deadline) {
    const length = await page.evaluate(() => document.body.innerText.length);
    if (length > 0 && length === previous) return;
    previous = length;
    await page.waitForTimeout(250);
  }
};

// Runs in the page, so it can't read this module.
const scanPage = ({ maxLines, minGap, maxLowContrast }) => {
  const main = document.querySelector('main') ?? document.body;
  const hits = {
    brokenWord: [], brokenPair: [], overlap: [], tooClose: [], outOfBox: [], cut: [], tallRow: [],
    raw: [], emptyHeading: [], unnamed: [], titleAttr: [], lowContrast: []
  };
  const add = (kind, text) => {
    if (!hits[kind].includes(text)) hits[kind].push(text);
  };
  const where = (el) => (el.closest('tr, li, article') ?? el).innerText?.replace(/\s+/g, ' ').slice(0, 60) ?? '';
  const memo = (fn) => {
    const cache = new Map();
    return (el) => {
      if (!cache.has(el)) cache.set(el, fn(el));
      return cache.get(el);
    };
  };
  const style = memo((el) => getComputedStyle(el));
  const shown = (el) => style(el).visibility === 'visible' && Number(style(el).opacity) > 0.01;
  // The closest pinned or floating ancestor: text in different layers passes over each other on purpose.
  const layer = memo((el) => {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      if (['fixed', 'sticky', 'absolute'].includes(style(node).position)) return node;
    }
    return null;
  });
  const blockOf = memo((el) => (style(el).display === 'inline' && el.parentElement ? blockOf(el.parentElement) : el));
  const clipOf = memo((el) => {
    const parent = el.parentElement;
    if (!parent || parent === document.body) return { left: -1e6, right: 1e6, by: null };
    const outer = clipOf(parent);
    const overflow = style(parent).overflowX;
    if (overflow === 'visible') return outer;
    const box = parent.getBoundingClientRect();
    const left = Math.max(outer.left, box.left);
    const right = Math.min(outer.right, box.right);
    return { left, right, by: right < outer.right || left > outer.left ? parent : outer.by };
  });
  const cardOf = memo((el) => {
    for (let node = el.parentElement; node && node !== main; node = node.parentElement) {
      const s = style(node);
      const bordered = parseFloat(s.borderRightWidth) >= 1 && s.borderRightStyle !== 'none';
      const filled = s.backgroundColor !== 'rgba(0, 0, 0, 0)' && parseFloat(s.borderTopLeftRadius) >= 4;
      if (bordered || filled) return node;
    }
    return null;
  });

  const rects = [];
  const cellLines = new Map();
  const walker = document.createTreeWalker(main, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue;
    const el = node.parentElement;
    if (!text?.trim() || !el || !shown(el) || el.closest('script, style, noscript')) continue;
    const box = el.getBoundingClientRect();
    if (box.width <= 2 || box.height <= 2) continue;
    const range = document.createRange();
    const linesOf = (from, to) => {
      range.setStart(node, from);
      range.setEnd(node, to);
      return new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size;
    };
    for (const match of text.matchAll(/[\p{L}\p{N}%.,_'’]{3,}/gu)) {
      if (linesOf(match.index, match.index + match[0].length) > 1) add('brokenWord', `${match[0]} @ ${where(el)}`);
    }
    // A lone pair: a longer list ("200 / 520 / 1,352") wraps between its numbers as a sentence does.
    for (const match of text.matchAll(/(?<![\d.,]|[\d.,A-Za-z%]\s*\/\s*)[\d.,]+[A-Za-z%]{0,3}\s*\/\s*[\d.,]+[A-Za-z%]{0,3}(?![\d.,A-Za-z%]|\s*\/)/g)) {
      if (linesOf(match.index, match.index + match[0].length) > 1) add('brokenPair', `${match[0]} @ ${where(el)}`);
    }
    range.selectNodeContents(node);
    const cell = el.closest('td, [role="cell"]');
    const clip = clipOf(el);
    const card = cardOf(el);
    const cardBox = card?.getBoundingClientRect();
    for (const r of range.getClientRects()) {
      if (r.width <= 0 || r.height <= 0) continue;
      const left = Math.max(r.left, clip.left);
      const right = Math.min(r.right, clip.right);
      if (right - left <= 0) continue;
      if (r.right > clip.right + 1 && clip.by && style(el).textOverflow !== 'ellipsis' && !el.closest('[role="tablist"], .MuiTabs-scroller')) {
        const scroller = /auto|scroll/.test(style(clip.by).overflowX);
        if (!scroller && style(clip.by).textOverflow !== 'ellipsis') add('cut', `${text.trim().slice(0, 30)} @ ${where(el)}`);
      }
      if (cardBox && (right > cardBox.right + 1 || left < cardBox.left - 1)) add('outOfBox', `${text.trim().slice(0, 30)} @ ${where(el)}`);
      if (cell) {
        if (!cellLines.has(cell)) cellLines.set(cell, new Set());
        cellLines.get(cell).add(Math.round(r.top));
      }
      rects.push({ left, right, top: r.top, bottom: r.bottom, el, text: text.trim() });
    }
  }

  rects.sort((a, b) => a.top - b.top);
  rects.forEach((a, index) => {
    for (let i = index + 1; i < rects.length && rects[i].top < a.bottom; i += 1) {
      const b = rects[i];
      if (a.el === b.el || a.el.contains(b.el) || b.el.contains(a.el) || layer(a.el) !== layer(b.el)) continue;
      const shared = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      const height = Math.min(a.bottom - a.top, b.bottom - b.top);
      const across = Math.min(a.right, b.right) - Math.max(a.left, b.left);
      if (across > 2 && shared > height * 0.4) {
        add('overlap', `${a.text.slice(0, 24)} over ${b.text.slice(0, 24)}`);
      } else if (shared > height * 0.5 && across <= 0 && -across < minGap && blockOf(a.el) !== blockOf(b.el)
        && /\d{3}/.test(a.text) && /\d{3}/.test(b.text)) {
        add('tooClose', `${a.text.slice(0, 24)} ${Math.round(-across * 10) / 10}px from ${b.text.slice(0, 24)}`);
      }
    }
  });

  [...cellLines.entries()].filter(([, lines]) => lines.size > maxLines).sort((a, b) => b[1].size - a[1].size)
    .forEach(([cell, lines]) => add('tallRow', `${lines.size} lines @ ${where(cell)}`));

  const pageText = main.innerText;
  const raw = (re) => {
    for (const match of pageText.match(re) ?? []) add('raw', match.trim());
  };
  raw(/.{0,30}[{}$@₣—^].{0,30}/g);
  // "~13d" is a page's own "about", and "Anon#f95d09" a real player's id.
  raw(/.{0,30}(?<!\d)~(?!\d).{0,30}/g);
  raw(/.{0,30}(?<!Anon)#[A-Za-z{].{0,30}/g);
  raw(/.{0,30}<[A-Za-z].{0,30}/g);
  raw(/.{0,20}[぀-鿿가-힯].{0,20}/g);
  raw(/.{0,30}∞.{0,30}/g);
  // A small percent to three figures is a wiki's drop rate ("0.000120%"), not a raw float.
  raw(/.{0,20}(?!\b0\.0*\d{1,3}%)\b\d+\.\d{4,}.{0,20}/g);
  raw(/.{0,25}\b(NaN|undefined|Infinity)\b.{0,25}/g);

  // Nothing drawn after a heading, up to its card: a folded section's heading sits in its button and isn't empty. The i
  // beside a heading is the heading's, so it isn't what the heading heads.
  const hasContent = (el) => el.getBoundingClientRect().height >= 4 && !el.matches('[aria-expanded].MuiButtonBase-root, :has(> [aria-expanded].MuiButtonBase-root:only-child)')
    && (el.innerText?.trim() || el.querySelector('img, svg, canvas'));
  main.querySelectorAll('h2, h3, h4, h5, h6').forEach((heading) => {
    if (!heading.getBoundingClientRect().height || heading.closest('button, summary, [aria-expanded], [role="button"]')) return;
    const card = cardOf(heading);
    for (let node = heading, depth = 0; node && node !== main && depth < 4; node = node.parentElement, depth += 1) {
      for (let next = node.nextElementSibling; next; next = next.nextElementSibling) {
        if (hasContent(next)) return;
      }
      if (node === card) break;
    }
    if (!card?.querySelector('[aria-expanded="false"]')) add('emptyHeading', heading.innerText.slice(0, 40));
  });

  main.querySelectorAll('a[href], button, input:not([type="hidden"]):not([aria-hidden="true"]), select, textarea, [tabindex]:not([tabindex="-1"])').forEach((el) => {
    // A folded Collapse's controls keep their box, and innerText reads nothing under visibility: hidden.
    if (!el.getBoundingClientRect().width || style(el).visibility !== 'visible') return;
    const name = el.getAttribute('aria-label') || el.getAttribute('aria-labelledby') || el.innerText || el.getAttribute('placeholder')
      || el.labels?.[0]?.innerText || el.querySelector('img[alt]:not([alt=""])')?.alt || '';
    if (!name.trim()) add('unnamed', `${el.tagName} ${el.getAttribute('href')?.slice(0, 40) ?? ''}`.trim());
  });
  // MUI's own Autocomplete buttons carry a title we can't take off.
  main.querySelectorAll('[title]:not(.MuiAutocomplete-popupIndicator, .MuiAutocomplete-clearIndicator)').forEach((el) => add('titleAttr', el.getAttribute('title').slice(0, 40)));

  // WCAG AA: 4.5, or 3 from 24 px, or from 18.66 px at 600 and up. The first opaque background up the tree, with what
  // is see-through on the way laid over it. An element's own opacity stays out: a dimmed row is a state, not a color.
  const rgba = (text) => {
    const srgb = text.match(/^color\(srgb ([\d.e-]+) ([\d.e-]+) ([\d.e-]+)(?: \/ ([\d.e-]+))?\)/);
    if (srgb) return [srgb[1] * 255, srgb[2] * 255, srgb[3] * 255, srgb[4] === undefined ? 1 : Number(srgb[4])];
    if (!/^rgba?\(/.test(text)) return null;
    const [r, g, b, a = 1] = text.match(/[\d.]+/g).map(Number);
    return [r, g, b, a];
  };
  const over = ([r, g, b, a], [r2, g2, b2]) => [r * a + r2 * (1 - a), g * a + g2 * (1 - a), b * a + b2 * (1 - a), 1];
  const luminance = ([r, g, b]) => {
    const [lr, lg, lb] = [r, g, b].map((part) => {
      const v = part / 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * lr + 0.7152 * lg + 0.0722 * lb;
  };
  const backgroundOf = (el) => {
    const layers = [];
    for (let node = el; node; node = node.parentElement) {
      const color = rgba(style(node).backgroundColor);
      if (color?.[3] > 0) layers.push(color);
      if (color?.[3] === 1) break;
    }
    return layers.reduceRight((under, layer) => over(layer, under), [255, 255, 255, 1]);
  };
  // Text over art has no one background to read against, so a person looks at it.
  const onArt = (el, box) => {
    if (el.closest('[data-on-art]')) return true;
    for (let node = el; node; node = node.parentElement) {
      if (style(node).backgroundImage !== 'none') return true;
      if (rgba(style(node).backgroundColor)?.[3] === 1) break;
    }
    return document.elementsFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      .some((under) => under !== el && !under.contains(el) && !el.contains(under) && under.matches('img, canvas, video'));
  };
  const contrastSeen = new Set();
  const contrastWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let node = contrastWalker.nextNode(); node && hits.lowContrast.length < maxLowContrast; node = contrastWalker.nextNode()) {
    const el = node.parentElement;
    if (!node.nodeValue?.trim() || !el || contrastSeen.has(el)) continue;
    contrastSeen.add(el);
    if (!shown(el) || el.closest('script, style, noscript, [aria-hidden="true"], [disabled], [aria-disabled="true"], .Mui-disabled')) continue;
    const box = el.getBoundingClientRect();
    if (box.width <= 2 || box.height <= 2) continue;
    const color = rgba(style(el).color);
    if (!color) continue;
    const background = backgroundOf(el);
    const [lighter, darker] = [luminance(over(color, background)), luminance(background)].sort((a, b) => b - a);
    const ratio = (lighter + 0.05) / (darker + 0.05);
    const size = parseFloat(style(el).fontSize);
    const large = size >= 24 || (size >= 18.66 && Number(style(el).fontWeight) >= 600);
    if (ratio >= (large ? 3 : 4.5) || onArt(el, box)) continue;
    add('lowContrast', `${ratio.toFixed(2)}:1 ${style(el).color} on rgb(${background.slice(0, 3).map(Math.round).join(', ')}): ${node.nodeValue.trim().slice(0, 30)}`);
  }

  return {
    hits,
    height: document.documentElement.scrollHeight,
    sideways: document.documentElement.scrollWidth - document.documentElement.clientWidth
  };
};

// main's text without what moves between runs. Hidden for the read rather than cut from a clone: innerText needs layout.
const pageDump = (page, root) => page.evaluate((selector) => {
  const volatile = [...document.querySelectorAll(`${selector} [data-volatile]`)];
  volatile.forEach((el) => el.style.setProperty('display', 'none'));
  const text = document.querySelector(selector)?.innerText ?? '';
  volatile.forEach((el) => el.style.removeProperty('display'));
  return text;
}, root);

// A sticky head only shows it's hidden once the page has scrolled under whatever pins above it. A long table is
// useStickyHeader's: past 80% of the height under the toolbar. A pinned head knows its top; any other goes by the bar's.
const hiddenHeads = (page) => page.evaluate(async () => {
  const main = document.querySelector('main') ?? document.body;
  const hidden = [];
  for (const table of main.querySelectorAll('table')) {
    const head = table.querySelector('thead th');
    if (!head?.getBoundingClientRect().width) continue;
    const pinned = getComputedStyle(head).position === 'sticky';
    const top = pinned ? parseFloat(getComputedStyle(head).top) : document.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
    if (table.getBoundingClientRect().height <= (innerHeight - top) * 0.8) continue;
    window.scrollTo(0, table.getBoundingClientRect().top + scrollY + innerHeight * 0.4);
    await new Promise((done) => setTimeout(done, 200));
    const r = head.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    if (r.bottom < 0 || r.top > innerHeight || !hit) hidden.push(`${head.innerText.slice(0, 20)} scrolled out of view`);
    else if (!head.contains(hit)) hidden.push(`${head.innerText.slice(0, 20)} under ${hit.tagName} ${String(hit.className).slice(0, 30)}`);
  }
  window.scrollTo(0, 0);
  return hidden;
});

const withQuery = (route, state) => {
  if (state !== 'demo') return route;
  return `${route}${route.includes('?') ? '&' : '?'}demo=true`;
};
const slugOf = (route, state, scheme) => `${route.replace(/^\//, '').replace(/[^a-zA-Z0-9-]+/g, '_') || 'home'}-${state}${scheme === 'dark' ? '' : `-${scheme}`}`;

const checkOne = async (browser, { route, state, size, scheme }) => {
  const touch = size.width < 768;
  const context = await browser.newContext({ viewport: size, storageState: consent, ...(touch ? { isMobile: true, hasTouch: true } : {}) });
  if (force) await context.addInitScript(forceSections, force);
  if (scheme !== 'dark') await context.addInitScript((mode) => localStorage.setItem('mui-mode', mode), scheme);
  if (storage) {
    await context.addInitScript((entries) => entries.forEach(([key, value]) => localStorage.setItem(key, JSON.stringify(value))), Object.entries(storage));
  }
  if (setup) await setup(context);
  if (opts.clock) await fixClock(context, opts.clock);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(String(error).slice(0, 200)));
  page.on('console', (message) => {
    if (message.type() === 'error' && !AD_NOISE.test(message.text()) && !(force && FORCED_LOG.test(message.text()))) errors.push(message.text().slice(0, 200));
  });
  const slug = slugOf(route, state, scheme);
  const result = { route, state, scheme, size: `${size.width}x${size.height}`, shots: [] };
  try {
    const response = await page.goto(opts.base + withQuery(route, state), { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (response?.status() >= 400) throw new Error(`HTTP ${response.status()}: no such page in this export`);
    // A moved URL forwards once the page is up: a scan that lands in that navigation is asked again, on where it landed.
    const scanned = async (attempts = 3) => {
      try {
        await waitForRender(page);
        await page.waitForTimeout(500 + Number(opts.settle));
        // A moved URL forwards in that gap, and the new route opens on its loader.
        await waitForRender(page);
        return await page.evaluate(scanPage, { maxLines: Number(opts['max-lines']), minGap: Number(opts['min-gap']), maxLowContrast: MAX_LOW_CONTRAST });
      } catch (error) {
        if (attempts <= 1 || !/context was destroyed|reading 'innerText'/.test(error.message)) throw error;
        await page.waitForTimeout(1000);
        return scanned(attempts - 1);
      }
    };
    if (opts.click) {
      await waitForRender(page);
      await page.locator(opts.click).first().click();
      await page.waitForTimeout(500);
    }
    const { hits, height, sideways } = await scanned();
    hits.hiddenHead = await hiddenHeads(page);
    hits.error = errors;
    if (sideways > 1) hits.sideways = [`${sideways}px`];
    result.height = height;
    result.hits = Object.fromEntries(Object.entries(hits).filter(([, list]) => list.length));
    writeFileSync(join(opts.out, `${slug}-${size.width}.txt`), await pageDump(page, opts.click ? 'body' : 'main').catch(() => ''));
    if (!opts['no-shots']) {
      if (touch) {
        for (let i = 0, y = 0; i < PHONE_SHOTS && y < height; i += 1, y += size.height - 80) {
          await page.evaluate((top) => window.scrollTo(0, top), y);
          await page.waitForTimeout(250);
          const file = join(opts.out, `${slug}-${size.width}-${i}.png`);
          await page.screenshot({ path: file });
          result.shots.push(file);
        }
      } else {
        const file = join(opts.out, `${slug}-${size.width}.png`);
        await page.screenshot({ path: file, fullPage: true, clip: { x: 0, y: 0, width: size.width, height: Math.min(height, MAX_SHOT_HEIGHT) } });
        result.shots.push(file);
      }
    }
  } catch (error) {
    result.failed = error.message.split('\n')[0].slice(0, 160);
  }
  await context.close();
  return result;
};

// One image per route and state, every size side by side, so a look at a page is one read.
const writeSheet = async (browser, slug, shots) => {
  if (!shots.length) return null;
  const page = await browser.newPage({ viewport: { width: 1800, height: 900 } });
  const images = shots.map((file) => `<img src="${pathToFileURL(resolve(file)).href}" style="width:${/-\d{3}-\d\.png$/.test(file) ? 240 : 560}px;vertical-align:top;margin:4px">`).join('');
  writeFileSync(join(opts.out, `${slug}.html`), `<body style="margin:0;background:#222">${images}</body>`);
  await page.goto(pathToFileURL(resolve(join(opts.out, `${slug}.html`))).href);
  await page.waitForTimeout(300);
  const file = join(opts.out, `${slug}.png`);
  await page.screenshot({ path: file, fullPage: true });
  await page.close();
  return file;
};

if (!routes.length) {
  console.error('usage: node tools/page-check.mjs <route...> [--sizes 1920,1366,900,384] [--states demo,guest] [--out dir]');
  process.exit(2);
}
mkdirSync(opts.out, { recursive: true });
const browser = await chromium.launch();
const jobs = routes.flatMap((route) => states.flatMap((state) => schemes.flatMap((scheme) => sizes.map((size) => ({ route, state, size, scheme })))));
const results = [];
let next = 0;
await Promise.all(Array.from({ length: Number(opts.workers) }, async () => {
  while (next < jobs.length) results.push(await checkOne(browser, jobs[next++]));
}));

const order = (a, b) => a.route.localeCompare(b.route) || a.state.localeCompare(b.state) || a.scheme.localeCompare(b.scheme) || parseInt(b.size) - parseInt(a.size);
results.sort(order);
let hitCount = 0;
for (const result of results) {
  const kinds = Object.entries(result.hits ?? {});
  hitCount += kinds.length + (result.failed ? 1 : 0);
  console.log(`${result.route} ${result.state} ${result.scheme === 'dark' ? '' : `${result.scheme} `}${result.size} height ${result.height ?? '?'}: ${result.failed ?? (kinds.map(([kind, list]) => `${kind} ${list.length}`).join(', ') || 'clean')}`);
  for (const [kind, list] of kinds) console.log(`  ${kind}: ${list.slice(0, 5).join(' || ')}`);
}
if (!opts['no-shots']) {
  for (const route of routes) {
    for (const state of states) {
      for (const scheme of schemes) {
        const slug = slugOf(route, state, scheme);
        const sheet = await writeSheet(browser, slug, results.filter((r) => r.route === route && r.state === state && r.scheme === scheme).flatMap((r) => r.shots));
        if (sheet) console.log(`sheet: ${sheet}`);
      }
    }
  }
}
await browser.close();
writeFileSync(join(opts.out, 'report.json'), JSON.stringify(results, null, 1));
if (results.some((r) => /ERR_CONNECTION_REFUSED/.test(r.failed ?? ''))) {
  console.error(`The server at ${opts.base} is down: restart it and rerun.`);
  process.exit(2);
}
process.exit(hitCount ? 1 : 0);
