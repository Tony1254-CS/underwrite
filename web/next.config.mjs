/** @type {import('next').NextConfig} */
const nextConfig = {
  // Defaults to ".next" (unchanged). Set NEXT_DIST_DIR to run a second dev server beside a
  // running `next start` without overwriting its build output.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
