import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@saltmarket/contracts"],
};

export default nextConfig;
