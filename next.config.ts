import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: "/checkout",
        headers: [{ key: "Permissions-Policy", value: "payment=*" }],
      },
      {
        source: "/api/pay",
        headers: [{ key: "Permissions-Policy", value: "payment=*" }],
      },
    ];
  },
};

export default nextConfig;
