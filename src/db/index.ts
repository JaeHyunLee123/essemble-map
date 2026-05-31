// Drizzle ORM DB 클라이언트 인스턴스 - 앱 전역에서 DB 접근에 사용
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";
import { config } from 'dotenv';

config({ path: '.env' });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL 환경변수가 설정되지 않았습니다.");
}

// 서버리스 환경(Next.js API Routes)에서 연결 풀 과부하 방지 및 어드민 다중 API 동시 요청 처리를 위해 max: 10으로 설정
// Supabase Transaction Pooler(6543)와의 호환성을 위해 prepare: false 설정
const client = postgres(process.env.DATABASE_URL, { max: 10, prepare: false });

export const db = drizzle(client, { schema });
