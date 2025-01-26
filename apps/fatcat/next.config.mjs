/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false, // ignore the 'fs' module
    };
    return config;
  },
  experimental: {
    // Edge runtime is now configured per-route using config export
  },
};

export default nextConfig;
