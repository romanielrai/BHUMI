import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**'
      }
    ]
  },
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';
    return {
      // Proxy the backend auth endpoints before NextAuth's /api/auth/[...nextauth] route claims them.
      beforeFiles: [
        { source: '/api/auth/login', destination: `${apiUrl}/auth/login` },
        { source: '/api/auth/register', destination: `${apiUrl}/auth/register` }
      ],
      afterFiles: [],
      // Everything else under /api (except NextAuth's own routes) proxies to the backend.
      fallback: [
        {
          source: '/api/:path*',
          destination: `${apiUrl}/:path*`
        }
      ]
    };
  }
};

export default nextConfig;
