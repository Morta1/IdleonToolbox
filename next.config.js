module.exports = {
  reactStrictMode: false,
  swcMinify: true,
  assetPrefix: '/',
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images:{
    unoptimized: true
  },
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
}
