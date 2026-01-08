/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode
  reactStrictMode: true,
  // Standalone output for smaller deployments (Railway, Docker)
  output: 'standalone',
};

export default nextConfig;
