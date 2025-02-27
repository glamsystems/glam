/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.fallback = {
      fs: false, // ignore the 'fs' module
    };
    return config;
  },
};

export default nextConfig;
