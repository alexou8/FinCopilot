import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const isGithubPages = process.env.GITHUB_PAGES === 'true';
const repoName = 'FinCopilot';

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,

  // Static export for GitHub Pages
  ...(isGithubPages && {
    output: 'export',
    basePath: `/${repoName}`,
    images: { unoptimized: true },
  }),

  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  // rewrites are only supported in server-mode builds
  ...(!isGithubPages && {
    async rewrites() {
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000';
      return [
        {
          source: '/api/:path*',
          destination: `${backendUrl}/:path*`,
        },
      ];
    },
  }),
};

export default nextConfig;
