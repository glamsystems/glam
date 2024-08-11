/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false, // ignore the 'fs' module
    };
    return config;
  },
};

export default nextConfig;
