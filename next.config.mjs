/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  
  // 실험적 기능 비활성화 (안정성을 위해)
  experimental: {
    esmExternals: false,
  },
  
  // Add rewrites for API proxy to bypass CORS during development
  async rewrites() {
    return [
      {
        source: '/api/proxy/:path*',
        destination: 'http://43.203.156.19:8080/:path*',
      },
    ]
  },
  
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    API_BASE_URL: process.env.API_BASE_URL,
  },
}

export default nextConfig
