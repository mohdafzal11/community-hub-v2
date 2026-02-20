import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@dicebear/core", "@dicebear/collection"],
};

export default nextConfig;
