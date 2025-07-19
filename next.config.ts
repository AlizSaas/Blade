import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@node-rs/argon2"], // Add any other external packages here
  experimental:{
    staleTimes:{
      dynamic: 30  // Set the dynamic stale time to 30 seconds
    }
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: `/a/${process.env.NEXT_PUBLIC_UPLOADTHING_APP_ID}/*`,
      },
    ],
    domains: ["utfs.io", "vy5eugwyb5.ufs.sh"],
  },
};

export default nextConfig;