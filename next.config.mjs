/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // Optimize server component caching
    serverComponentsExternalPackages: ['@supabase/supabase-js'],
  },
  // Reduce memory usage during builds
  swcMinify: true,
}

export default nextConfig
