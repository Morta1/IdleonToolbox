module.exports = {
  siteUrl: 'https://idleontoolbox.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
  sitemapSize: 7000,
  exclude: ['/404', '/_error'],
  robotsTxtOptions: {
    additionalSitemaps: [
      'https://idleontoolbox.com/sitemap.xml',
    ],
    policies: [
      {
        userAgent: '*',
        allow: '/',
      },
    ],
  },
  additionalPaths: async () => {
    const result = []
    // Demo page
    result.push({
      loc: '/?demo=true',
      changefreq: 'yearly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    })
    
    // Add important dynamic pages
    result.push({
      loc: '/dashboard',
      changefreq: 'daily',
      priority: 0.9,
      lastmod: new Date().toISOString(),
    })
    
    return result;
  }
}