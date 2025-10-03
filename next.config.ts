import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // allow https://images.unsplash.com
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
