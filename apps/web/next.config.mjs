/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lab/logger', '@lab/ui'],
  // The bare origin has no page of its own: it sends a visitor to the fixed
  // page until the compare page lands (#4). A redirect rather than a page, so
  // it is not a route a screen story must claim.
  async redirects() {
    return [{ source: '/', destination: '/after', permanent: false }];
  },
};

export default nextConfig;
