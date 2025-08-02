/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static export for S3 deployment
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // Disable image optimization for static export
  images: {
    unoptimized: true,
  },
  
  // 실험적 기능 비활성화 (안정성을 위해)
  experimental: {
    esmExternals: false,
  },
  
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
  },
}

export default nextConfig
