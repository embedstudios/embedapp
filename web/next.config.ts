import type { NextConfig } from 'next';

// Static export: the app is served as plain files on every project subdomain,
// and works out which project to show from the hostname in the browser.
const config: NextConfig = {
  output: 'export',
  trailingSlash: true,
  images: { unoptimized: true },
  reactStrictMode: true,
};

export default config;
