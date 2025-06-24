import fs from 'fs'
import {globby} from 'globby'

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
    <loc>${`https://www.idleontoolbox.com${route}`}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${priority}</priority>
  </url>`
}

async function generateSitemap() {
  // Ignore Next.js specific files (e.g., _app.js) and API routes.
  const pages = await globby([
    'pages/**/*{.js,.jsx,.mdx}',
    '!pages/_*.js',
    '!pages/_*.jsx',
    '!pages/api',
  ])
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map(addPage).join('\n')}
</urlset>`

  fs.writeFileSync('public/sitemap.xml', sitemap)
}

console.log('starting sitemap generation')
generateSitemap()
console.log('finished sitemap generation')