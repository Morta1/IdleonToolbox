import fs from 'fs'
import path from 'path'
import { execFileSync } from 'child_process'
import {globby} from 'globby'
import { fetchAllBuildsAtBuildTime } from './builds/static-fetch.mjs'
import { buildsForSlug, getBuildClassSlugs } from './builds/class-paths.mjs'
import { buildStaticHref, buildToSlug } from './builds/build-pages.mjs'
import { hasListing } from './wiki/kinds.mjs'

// Helper to determine priority based on path
function getPagePriority(path) {
  // Home page gets highest priority
  if (path === '/index') return 1.0;
  // Main sections get high priority
  if (path === '/dashboard' || path === '/characters' || path === '/data' || path.startsWith('/tools/')) return 0.9;
  // Account pages get medium priority
  if (path.startsWith('/account/')) return 0.8;
  // Default priority for other pages
  return 0.7;
}

const urlBlock = ({ loc, lastmod, changefreq = 'weekly', priority }) => `  <url>
    <loc>https://idleontoolbox.com${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`

// An index page exports as its directory, not as a file called index: pages/tools/index.jsx
// becomes out/tools.html, so a /tools/index entry is a crawler sent to a 404. Only the root was
// special-cased before, so /tools/index shipped in every sitemap.
export function routeToLoc(path) {
  if (path === '/index') return ''
  return path.replace(/\/index$/, '')
}

// Every entry used to carry the build date, so all 231 URLs claimed to have changed on every
// deploy. Google's sitemap docs are explicit that it ignores lastmod outright once it decides the
// value is unreliable, and "everything changed today, again" is the canonical way to earn that -
// so the field was not merely useless, it was spending the one recrawl-prioritisation signal the
// sitemap has. Each generator below now derives a date from whatever actually determines that
// page's content.
//
// Understating is the safe direction. A page whose imported component changed but whose own file
// did not keeps its older date and is recrawled a little later; overstating is what makes Google
// stop reading the field at all.
const DATE_LINE = /^\d{4}-\d{2}-\d{2}$/

// A shallow clone has no per-file history: `git log` sees one commit, so every page would report
// the same date and we would be back to a synthetic value. actions/checkout defaults to
// fetch-depth 1, hence the explicit `fetch-depth: 0` in .github/workflows/deploy.yml.
function isShallowRepo() {
  try {
    return execFileSync('git', ['rev-parse', '--is-shallow-repository'], { encoding: 'utf8' })
      .trim() === 'true'
  } catch {
    return false
  }
}

// One `git log` walk rather than a subprocess per page - there are ~110 of them and this runs on
// every deploy. Output is newest-first, so the first date seen for a path is that path's latest.
export function gitCommitDates(dir) {
  if (isShallowRepo()) {
    console.warn(
      'warning: shallow git clone - falling back to the build date for page lastmod. ' +
      'Set fetch-depth: 0 on actions/checkout so per-file history exists.'
    )
    return null
  }

  let out
  try {
    out = execFileSync(
      'git',
      ['log', '--format=%cs', '--name-only', '--diff-filter=ACMRT', '--', dir],
      { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
    )
  } catch (error) {
    console.warn(`warning: git log failed (${error.message}) - page lastmod falls back to the build date.`)
    return null
  }

  const dates = new Map()
  let current = null
  for (const line of out.split('\n')) {
    const entry = line.trim()
    if (!entry) continue
    if (DATE_LINE.test(entry)) {
      current = entry
      continue
    }
    if (current && !dates.has(entry)) dates.set(entry, current)
  }
  return dates
}

// A page with no git date is one that is new and uncommitted, so the build date is the honest
// answer rather than a fallback.
export function pageLastmod(page, dates, fallback) {
  return dates?.get(page) || fallback
}

function addPage(page, dates, fallback) {
  const path = page.replace('pages', '').replace('.jsx', '').replace('.js', '').replace('.mdx', '')
  return urlBlock({
    loc: routeToLoc(path),
    lastmod: pageLastmod(page, dates, fallback),
    priority: getPagePriority(path)
  })
}

// Interactive or user-specific pages with no search value. /view without a
// query param renders nothing at all.
const EXCLUDED_BUILD_ROUTES = [
  '/tools/builds/new',
  '/tools/builds/edit',
  '/tools/builds/my-builds',
  '/tools/builds/view'
]

// updatedAt is absent on a build nobody has edited, so createdAt is the real date there rather
// than a fallback. Both come back from the list endpoint as ISO 8601.
export function buildLastmod(build, fallback) {
  const raw = build?.updatedAt || build?.createdAt
  if (!raw) return fallback
  const ms = new Date(raw).getTime()
  return Number.isNaN(ms) ? fallback : new Date(ms).toISOString().split('T')[0]
}

// What a class page shows is the builds in it, so it changed when its newest member did. A family
// slug covers its whole family and always has a page, so one with no builds at all falls back.
// YYYY-MM-DD sorts lexicographically, which is why this can reduce on the strings.
export function classLastmod(builds, slug, fallback) {
  const dates = buildsForSlug(builds, slug)
    .map((build) => buildLastmod(build, null))
    .filter(Boolean)
  return dates.length ? dates.reduce((a, b) => (a > b ? a : b)) : fallback
}

export function buildClassSitemapEntries(slugs, fallback, builds) {
  return (slugs || []).map((slug) => `  <url>
    <loc>https://idleontoolbox.com/tools/builds/${slug}</loc>
    <lastmod>${classLastmod(builds, slug, fallback)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')
}

// shortId is [A-Za-z0-9]{4,10} per the Worker's own route matcher, so it needs no XML escaping —
// but assert it rather than trust it, since this interpolates straight into <loc>.
const SAFE_SHORT_ID = /^[A-Za-z0-9]{4,10}$/

// Each build has its own exported page now. /tools/builds/view still resolves builds published
// since the last deploy, but it is one URL serving many builds and canonicalises to the static
// path, so it has no place here — these entries are the static pages themselves.
export function buildDetailSitemapEntries(builds, fallback) {
  return (builds || [])
    .filter((build) => SAFE_SHORT_ID.test(build?.shortId || ''))
    .map((build) => `  <url>
    <loc>https://idleontoolbox.com${buildStaticHref(build)}</loc>
    <lastmod>${buildLastmod(build, fallback)}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`).join('\n')
}

// This script runs as the `postbuild` npm script under plain Node, not through Next.js — Next
// loads .env files for getStaticProps, plain Node loads nothing. Without this,
// fetchAllBuildsAtBuildTime() would throw "NEXT_PUBLIC_BUILDS_URL is not set" on every build.
//
// Order mirrors Next's own precedence: .env.local wins over .env.production. An earlier version
// deliberately read .env.production only, so the deployed sitemap would always name production
// URLs. That produced the opposite of what it intended - `next build` still honoured .env.local,
// so on any machine with one the pages came from the dev Worker while the sitemap came from
// production, and the two disagreed about which classes exist. The invariant that matters is
// that the sitemap matches the pages actually built, not that it names a particular host.
// pruneUnexportedSlugs below enforces it regardless.
const ENV_FILES = ['.env.local', '.env.production']

// postbuild runs under plain Node, not Next, so nothing has loaded the .env files that
// fetchAllBuildsAtBuildTime() needs for NEXT_PUBLIC_BUILDS_URL.
//
// Order mirrors Next's own precedence: .env.local wins, and a real process.env value beats both.
// An earlier version read .env.production only, so the deployed sitemap would always name
// production URLs - which produced the opposite of what it intended, since `next build` still
// honoured .env.local. On any machine with one, the pages came from the dev Worker and the
// sitemap from production, and the two disagreed about which classes exist.
function loadBuildEnv() {
  for (const file of ENV_FILES) {
    const envPath = path.resolve(process.cwd(), file)
    if (fs.existsSync(envPath)) process.loadEnvFile(envPath)
  }
}

// A sitemap entry for a class page that was never exported is a 404 served to a crawler that was
// explicitly invited to it, so the list is checked against the files on disk rather than trusting
// that both halves of the build fetched the same data.
//
// Drops the offending slugs rather than failing. `next build` and this script fetch separately,
// minutes apart, from a database other people write to - so a build published mid-run legitimately
// produces a slug with no exported page. Failing there would kill a deploy (possibly carrying an
// unrelated fix) over something that resolves itself on the next one, and the page still gets
// listed then. The other cause, the two halves resolving different .env files, cannot happen in
// CI at all: .env.local is gitignored, so both always land on .env.production.
// Null when out/ has no builds directory at all — nothing was exported to check against, so
// callers pass their list through untouched rather than pruning it to nothing.
function exportedSlugs(outDir) {
  const dir = path.join(outDir, 'tools', 'builds')
  if (!fs.existsSync(dir)) return null
  return new Set(
    fs.readdirSync(dir)
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''))
  )
}

export function pruneUnexportedSlugs(slugs, outDir) {
  const exported = exportedSlugs(outDir)
  if (!exported) return slugs

  const missing = slugs.filter((slug) => !exported.has(slug))
  if (missing.length) {
    console.warn(
      `warning: omitting ${missing.length} class page(s) from the sitemap - exported no HTML: ` +
      `${missing.join(', ')}. Expected if a build was published mid-run; if it persists, check ` +
      `which .env file next build and this script each resolved.`
    )
  }
  return slugs.filter((slug) => exported.has(slug))
}

// Same rule for build pages, and for the same reason: a build published between next build's
// fetch and this script's fetch has a slug but no exported file, and a sitemap entry pointing at
// a 404 is worse than one missing entry that the next deploy adds.
export function pruneUnexportedBuilds(builds, outDir) {
  const exported = exportedSlugs(outDir)
  if (!exported) return builds

  const kept = (builds || []).filter((build) => exported.has(buildToSlug(build)))
  const dropped = (builds || []).length - kept.length
  if (dropped) {
    console.warn(
      `warning: omitting ${dropped} build page(s) from the sitemap - exported no HTML. ` +
      `Expected if a build was published mid-run; if it persists, check which .env file ` +
      `next build and this script each resolved.`
    )
  }
  return kept
}

// One entry per wiki entity, plus one per category listing. lastmod comes from the graph file
// rather than from today: the wiki's content changes when the game data is regenerated, and dating
// 3,466 URLs to every deploy is exactly the unreliable lastmod that makes Google ignore the field.
export function buildWikiSitemapEntries(fallbackDate) {
  const graphPath = path.join('data', 'entity-graph.json')
  if (!fs.existsSync(graphPath)) return ''

  const lastmod = fs.statSync(graphPath).mtime.toISOString().split('T')[0]
  const date = DATE_LINE.test(lastmod) ? lastmod : fallbackDate
  const { nodes } = JSON.parse(fs.readFileSync(graphPath, 'utf-8'))

  const kinds = new Set()
  const entities = []
  for (const node of Object.values(nodes)) {
    if (node.navigable === false || !node.slug) continue
    kinds.add(node.kind)
    entities.push(`/wiki/${node.kind}/${node.slug}`)
  }

  // Sorted, or the sitemap rewrites itself on every build and lands a fresh gh-pages commit for
  // no change in content - the same reason keptPages is sorted.
  // Only the kinds that have a listing page: quests are reached from their giver, and a sitemap
  // entry for /wiki/quest would point at a URL the export never writes.
  const locs = [...[...kinds].filter(hasListing).map((kind) => `/wiki/${kind}`), ...entities].sort()
  return locs
    .map((loc) => urlBlock({ loc, lastmod: date, priority: loc.split('/').length > 3 ? 0.6 : 0.7 }))
    .join('\n')
}

async function generateSitemap() {
  const pages = await globby([
    'pages/**/*{.js,.jsx,.mdx}',
    '!pages/_*.js',
    '!pages/_*.jsx',
    '!pages/404.jsx',
    '!pages/api',
    // Dynamic route — real slugs are appended below. Without this exclusion the
    // glob emits a literal /tools/builds/[slug] URL.
    '!pages/tools/builds/[slug].jsx',
    // Same, for the wiki: one file serves 3,466 entities and six category listings.
    '!pages/wiki/[kind]/[slug].jsx',
    '!pages/wiki/[kind]/index.jsx',
  ])

  const routeOf = (page) =>
    page.replace('pages', '').replace('.jsx', '').replace('.js', '').replace('.mdx', '')

  // globby's order isn't stable, and an unsorted sitemap rewrites itself on every build - noise
  // in the diff and a fresh commit on the gh-pages branch for no change in content.
  const keptPages = pages
    .filter((page) => !EXCLUDED_BUILD_ROUTES.includes(routeOf(page)))
    .sort()

  const builds = await fetchAllBuildsAtBuildTime()
  const today = new Date().toISOString().split('T')[0]
  const gitDates = gitCommitDates('pages')
  const classSlugs = pruneUnexportedSlugs(getBuildClassSlugs(builds), 'out')
  const classEntries = buildClassSitemapEntries(classSlugs, today, builds)
  const detailEntries = buildDetailSitemapEntries(pruneUnexportedBuilds(builds, 'out'), today)
  const wikiEntries = buildWikiSitemapEntries(today)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${keptPages.map((page) => addPage(page, gitDates, today)).join('\n')}
${classEntries}
${detailEntries}
${wikiEntries}
</urlset>`

  fs.writeFileSync('public/sitemap.xml', sitemap)
  // postbuild runs after next build has already produced out/, so writing only
  // to public/ leaves the deployed sitemap one build stale.
  if (fs.existsSync('out')) fs.writeFileSync('out/sitemap.xml', sitemap)
}

// Only run when invoked as a script (npm postbuild), not when imported by tests.
if (import.meta.main) {
  loadBuildEnv()
  console.log('starting sitemap generation')
  generateSitemap()
    .then(() => console.log('finished sitemap generation'))
    .catch((error) => {
      console.error('sitemap generation failed:', error.message)
      process.exit(1)
    })
}
