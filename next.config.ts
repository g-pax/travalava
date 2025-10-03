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
      {
        protocol: "https",
        hostname: "cdn.getyourguide.com",
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "dynamic-media-cdn.tripadvisor.com",
        port: "",
        pathname: "/media/**",
      },
    ],
  },
};

export default nextConfig;
