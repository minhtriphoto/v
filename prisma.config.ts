import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// Prisma 7: kết nối DB không còn khai báo trong schema.prisma nữa mà ở đây.
// migrate/db push dùng DIRECT_URL (kết nối trực tiếp, không qua pgBouncer)
// vì Supabase pooled connection (6543) không hỗ trợ một số lệnh DDL/prepared statements.
export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DIRECT_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
});
