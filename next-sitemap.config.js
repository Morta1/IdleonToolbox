module.exports = {
  siteUrl: 'https://idleontoolbox.com',
  generateRobotsTxt: true,
  additionalPaths: async () => {
    const result = []
    result.push({
      loc: '/?demo=true',
      changefreq: 'yearly',
      priority: 0.7,
      lastmod: new Date().toISOString(),
    })
    return result;
  }
}