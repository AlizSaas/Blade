import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  serverExternalPackages: ["@node-rs/argon2", "@prisma/client", "prisma"],
  outputFileTracingIncludes: {
    // Prisma's query engine binary must be force-included for every route that
    // can reach it, not just /api/**: Server Actions (e.g. generateInvitationCode)
    // are invoked as POSTs to the page they're called from, so pages using them
    // need the engine in their own serverless function bundle too.
    "/**/*": ["./src/generated/prisma/**/*"],
  },
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