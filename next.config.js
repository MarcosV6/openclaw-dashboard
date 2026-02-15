/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  experimental: {
    // Add Tailscale-specific networking configurations if needed
    // networkTimeout: 30000,
  },
};

module.exports = nextConfig;