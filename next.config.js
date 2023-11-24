/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["ffmpeg-static"],
  },
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
