import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
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

function addPage(page) {
  const path = page.replace('pages', '').replace('.jsx', '').replace('.js', '').replace('.mdx', '')
  const route = path === '/index' ? '' : path
  const priority = getPagePriority(path)
  const today = new Date().toISOString().split('T')[0]

  return `  <url>
    <loc>${`https://idleontoolbox.com${route}`}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
}

// Interactive or user-specific pages with no search value. /view without a
// query param renders nothing at all.
export const EXCLUDED_BUILD_ROUTES = [
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

// This script runs as the `postbuild` npm script under plain Node, not through
// Next.js — Next loads .env.production/.env.local for getStaticProps, but
// plain Node loads nothing. Without this, fetchAllBuildsAtBuildTime() would
// throw "NEXT_PUBLIC_BUILDS_URL is not set" on every build.
//
// Read .env.production only (not .env.local): .env.local is gitignored,
// machine-local, and points at a localhost dev server — this script must
// always resolve the real production URL when generating the deployed
// sitemap. Real process.env values (e.g. injected by the host) win over
// anything in the file.
function loadProductionEnv() {
  const envPath = path.resolve(process.cwd(), '.env.production')
  if (!fs.existsSync(envPath)) return

  const contents = fs.readFileSync(envPath, 'utf8')
  for (const line of contents.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue

    const eqIndex = trimmed.indexOf('=')
    if (eqIndex === -1) continue

    const key = trimmed.slice(0, eqIndex).trim()
    let value = trimmed.slice(eqIndex + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }

    if (!(key in process.env)) process.env[key] = value
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

  const keptPages = pages.filter((page) => !EXCLUDED_BUILD_ROUTES.includes(routeOf(page)))

  const builds = await fetchAllBuildsAtBuildTime()
  const today = new Date().toISOString().split('T')[0]
  const classEntries = buildClassSitemapEntries(getBuildClassSlugs(builds), today)

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${keptPages.map(addPage).join('\n')}
${classEntries}
</urlset>`

  fs.writeFileSync('public/sitemap.xml', sitemap)
  // postbuild runs after next build has already produced out/, so writing only
  // to public/ leaves the deployed sitemap one build stale.
  if (fs.existsSync('out')) fs.writeFileSync('out/sitemap.xml', sitemap)
}

// Only run when invoked as a script (npm postbuild), not when imported by tests.
const isDirectRun =
  process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])

if (isDirectRun) {
  loadProductionEnv()
  console.log('starting sitemap generation')
  generateSitemap()
    .then(() => console.log('finished sitemap generation'))
    .catch((error) => {
      console.error('sitemap generation failed:', error.message)
      process.exit(1)
    })
}
