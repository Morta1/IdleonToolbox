const isProd = process.env.NODE_ENV === "production";

module.exports = {
  reactStrictMode: true,
  assetPrefix: isProd ? "/IdleonCardSearch/" : "",
  eslint: {
    ignoreDuringBuilds: true,
  },
};
