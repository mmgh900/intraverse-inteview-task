import type { NextConfig } from "next";
import path from "path";

const isDocker = process.env.DOCKER_BUILD === '1';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@intraverse/shared'],
  ...(isDocker && {
    outputFileTracingRoot: path.join(__dirname, '../../'),
    turbopack: {
      root: path.join(__dirname, '../../'),
    },
  }),
};

export default nextConfig;
