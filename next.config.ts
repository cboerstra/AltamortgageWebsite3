import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // The previous site's reviews page; Google still lists it.
      { source: "/about/customer-testimonials", destination: "/testimonials", permanent: true },
    ];
  },
};

export default nextConfig;
