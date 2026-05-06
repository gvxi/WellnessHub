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
        headers: [
          { key: "Permissions-Policy", value: "payment=*" },
          // CSP is set per-response in the route handler; this header
          // would be overridden by it in modern browsers but listed here
          // to ensure nothing from the framework adds a restrictive policy.
        ],
      },
    ];
  },
};

export default nextConfig;
