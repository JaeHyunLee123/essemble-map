// Drizzle Kit 설정 파일 - DB 마이그레이션 및 스키마 관리를 위한 drizzle-kit 설정
import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";

// drizzle-kit은 .env 파일을 자동으로 읽지 않으므로 명시적으로 로드
config({ path: ".env" });

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL_DIRECT!,
  },
  verbose: true,
  strict: true,
});
