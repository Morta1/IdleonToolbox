import fs from 'fs'
import path from 'path'
import {globby} from 'globby'
import { fetchAllBuildsAtBuildTime } from './builds/static-fetch.mjs'
import { getBuildClassSlugs } from './builds/class-paths.mjs'

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

function addPage(page) {
  const path = page.replace('pages', '').replace('.jsx', '').replace('.js', '').replace('.mdx', '')
  return urlBlock({
    loc: path === '/index' ? '' : path,
    lastmod: new Date().toISOString().split('T')[0],
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

export function buildClassSitemapEntries(slugs, today) {
  return (slugs || []).map((slug) => `  <url>
    <loc>https://idleontoolbox.com/tools/builds/${slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`).join('\n')
}

// shortId is [A-Za-z0-9]{4,10} per the Worker's own route matcher, so it needs no XML escaping —
// but assert it rather than trust it, since this interpolates straight into <loc>.
const SAFE_SHORT_ID = /^[A-Za-z0-9]{4,10}$/

// /tools/builds/view is excluded above because it renders nothing without a query param, but the
// ?id= URLs are the actual build pages and each one now ships real metadata from the manifest in
// view.jsx. Without these entries the only route to a build is a link that exists solely after
// JS runs, which is the discovery failure this whole change set exists to fix.
export function buildDetailSitemapEntries(builds, today) {
  return (builds || [])
    .filter((build) => SAFE_SHORT_ID.test(build?.shortId || ''))
    .map((build) => `  <url>
    <loc>https://idleontoolbox.com/tools/builds/view?id=${build.shortId}</loc>
    <lastmod>${today}</lastmod>
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
// assertSitemapMatchesOutput below enforces it regardless.
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

// A sitemap entry for a class page that was never exported is a 404 served to a crawler that
// was explicitly invited to it. Compare against the files on disk rather than trusting that
// both halves of the build fetched the same data.
export function assertSitemapMatchesOutput(slugs, outDir) {
  const dir = path.join(outDir, 'tools', 'builds')
  if (!fs.existsSync(dir)) return

  const exported = new Set(
    fs.readdirSync(dir)
      .filter((f) => f.endsWith('.html'))
      .map((f) => f.replace(/\.html$/, ''))
  )
  const missing = slugs.filter((slug) => !exported.has(slug))
  if (missing.length) {
    throw new Error(
      `sitemap lists ${missing.length} class page(s) that were not exported: ${missing.join(', ')}. ` +
      `The pages and the sitemap were built from different data - check which .env file each half resolved.`
    )
  }
}

async function generateSitemap() {
  const pages = await globby([
    'pages/**/*{.js,.jsx,.mdx}',
    '!pages/_*.js',
    '!pages/_*.jsx',
    '!pages/404.jsx',
    '!pages/api',
    // Dynamic route — real slugs are appended below. Without this exclusion the
    // glob emits a literal /tools/builds/[class] URL.
    '!pages/tools/builds/[class].jsx',
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
  const classSlugs = getBuildClassSlugs(builds)
  assertSitemapMatchesOutput(classSlugs, 'out')
  const classEntries = buildClassSitemapEntries(classSlugs, today)
  const detailEntries = buildDetailSitemapEntries(builds, today)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${keptPages.map(addPage).join('\n')}
${classEntries}
${detailEntries}
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
