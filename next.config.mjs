/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000',
  },
  async redirects() {
    return [
      { source: '/overview', destination: '/bcas/overview', permanent: false },
      { source: '/strategy-overview', destination: '/bcas/strategy-overview', permanent: false },
      { source: '/strategic-objectives', destination: '/bcas/strategic-objectives', permanent: false },
      { source: '/scorecard-design', destination: '/bcas/scorecard-design', permanent: false },
      { source: '/objective-cascading', destination: '/bcas/objective-cascading', permanent: false },
      { source: '/kpi-management', destination: '/bcas/kpi-management', permanent: false },
      { source: '/kpi-configuration', destination: '/bcas/kpi-configuration', permanent: false },
      { source: '/team-performance', destination: '/bcas/team-performance', permanent: false },
      { source: '/performance-analysis', destination: '/bcas/performance-analysis', permanent: false },
      { source: '/performance-summary', destination: '/bcas/performance-summary', permanent: false },
      { source: '/reports', destination: '/bcas/reports', permanent: false },
      { source: '/system-overview', destination: '/bcas/system-overview', permanent: false },
      { source: '/data-integration', destination: '/bcas/data-integration', permanent: false },
      { source: '/user-management', destination: '/bcas/user-management', permanent: false },
      { source: '/system-settings', destination: '/bcas/system-settings', permanent: false },
      { source: '/system-administrator', destination: '/bcas/system-administrator', permanent: false },
      { source: '/all-user-overview', destination: '/bcas/all-user-overview', permanent: false },
    ]
  },
}

export default nextConfig
