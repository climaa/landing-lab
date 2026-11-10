/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@lab/logger', '@lab/ui'],
  // The bare origin has no page of its own: it opens on the compare page, the
  // lab's one screen. A redirect rather than a page, so it is not a route a
  // screen story must claim.
  async redirects() {
    return [{ source: '/', destination: '/compare', permanent: false }];
  },
};

export default nextConfig;
