import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/checkout",
        headers: [{ key: "Permissions-Policy", value: "payment=*" }],
      },
    ];
  },
};

export default nextConfig;
