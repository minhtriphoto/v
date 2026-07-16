import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prisma 7 + Turbopack (mặc định từ Next.js 16) cần khai báo rõ các gói này
  // để tránh lỗi "Cannot find module '.prisma/client/default'".
  serverExternalPackages: ["@prisma/client", "pg"],
  turbopack: {
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
};

export default nextConfig;
