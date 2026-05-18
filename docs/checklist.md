# 개발 체크리스트 (Phase 1)

## Phase 1.1: 프로젝트 초기 설정
- [x] Next.js 프로젝트 생성 (TypeScript, App Router, TailwindCSS, src 디렉토리 사용)
- [x] Drizzle ORM 및 Supabase 연동 패키지 설치
- [x] Drizzle 관련 개발 의존성 패키지 설치 (drizzle-kit, tsx 등)
- [x] `implementation_plans.md`의 진행 완료 항목 체크

## Phase 1.2: Supabase 연결 및 DB 설정
- [x] `.env.local.example` 환경변수 템플릿 생성
- [x] `drizzle.config.ts` Drizzle Kit 설정 파일 생성
- [x] `src/db/schema.ts` ERD 기반 Drizzle 스키마 정의 (Users, Studios, Rooms, EquipmentCategories, Equipments, Bookmarks)
- [x] `package.json`에 DB 마이그레이션 npm 스크립트 추가
- [x] `supabase/storage-setup.sql` Storage 버킷 생성 SQL 작성
- [x] (사용자) Supabase 프로젝트 콘솔에서 프로젝트 생성
- [x] (사용자) `.env` 파일에 실제 Supabase 자격증명 입력
- [x] (사용자) `npm run db:push` 또는 `npm run db:migrate` 실행으로 DB 스키마 적용
- [x] (사용자) Supabase SQL Editor에서 `supabase/storage-setup.sql` 실행
