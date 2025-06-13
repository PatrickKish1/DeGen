// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['iex.ec', 'www.iex.ec', 'images.unsplash.com'],
  },
  turbopack: {
    // Turbopack configuration
    resolveAlias: {
      // Add any aliases you need here
    },
    resolveExtensions: ['.mdx', '.tsx', '.ts', '.jsx', '.js', '.json'],
  },
};

module.exports = nextConfig;
