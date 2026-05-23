import type { NextConfig } from "next";
import { version } from "./package.json";

// Derive allowed image hostnames from S3_PUBLIC_URL at build/start time.
// Falls back to localhost:9000 for local dev with a local MinIO instance.
function imageRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const patterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
    { protocol: "http", hostname: "localhost", port: "9000" },
  ];

  const publicUrl = process.env.S3_PUBLIC_URL;
  if (publicUrl) {
    try {
      const u = new URL(publicUrl);
      patterns.push({
        protocol: u.protocol.replace(":", "") as "http" | "https",
        hostname: u.hostname,
        ...(u.port ? { port: u.port } : {}),
      });
    } catch {
      // invalid URL — skip
    }
  }

  return patterns;
}

const config: NextConfig = {
  output: process.env.NEXT_OUTPUT === "standalone" ? "standalone" : undefined,
  transpilePackages: ["@pathfinder/ui", "@pathfinder/db", "@pathfinder/shared"],
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: imageRemotePatterns(),
  },
};

export default config;
