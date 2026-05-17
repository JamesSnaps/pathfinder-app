import type { NextConfig } from "next";
import { version } from "./package.json";

const config: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  transpilePackages: ["@pathfinder/ui", "@pathfinder/db", "@pathfinder/shared"],
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default config;
