import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  outputFileTracingIncludes: {
    "/api/resolve": ["./node_modules/youtube-dl-exec/bin/**"],
  },
};

export default nextConfig;
