import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The previous site's reviews page; Google still lists it.
      { source: "/about/customer-testimonials", destination: "/testimonials", permanent: true },
      // The Vercel project address serves a full copy of the site. Send pages
      // to the real domain so search engines see one site. /api/ is left
      // alone: the reminder workflow may still POST to this address, and
      // curl without -L would treat a redirect as success.
      {
        source: "/:path((?!api/).*)",
        has: [{ type: "host", value: "altamortgage-website3.vercel.app" }],
        destination: "https://www.altamortgagegroup.net/:path",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
