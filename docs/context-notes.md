# Context Notes

## Phase 1.1: Next.js 프로젝트 및 기본 패키지 설정
- **Next.js 생성**: 현재 디렉토리(`/Users/ljh/Programming/assemble-room-map`)에 바로 Next.js 프로젝트를 설정합니다. 최신 버전을 사용하며 App Router, TypeScript, TailwindCSS를 기본으로 포함합니다.
- **Drizzle ORM & Supabase**: 향후 DB 연결 및 마이그레이션을 위해 `drizzle-orm`, `drizzle-kit`, `postgres` 모듈을 설치하고, Supabase Storage 및 연동 편의성을 위해 `@supabase/supabase-js` 패키지를 설치합니다.
- **패키지 매니저**: 명시적 설정이 없었으므로 기본적으로 `npm`을 사용합니다.

## Phase 1.2: Supabase 연결 및 DB 설정

- **DB 연결 방식**: Drizzle ORM + `postgres` 드라이버를 사용해 Supabase PostgreSQL에 직접 연결합니다. `DATABASE_URL`은 Supabase 프로젝트의 "Project Settings > Database > Connection string (URI)" 에서 확인 가능합니다. Connection Pooling 모드(port 6543)는 트랜잭션 모드이므로 마이그레이션에는 직접 연결(port 5432)을 사용합니다.
- **스키마 전략**: 단일 파일(`src/db/schema.ts`)에 모든 테이블을 정의합니다. 도메인이 명확히 분리되지 않았고 테이블 수가 적어 단일 파일이 더 간결합니다.
- **status 컬럼**: `Studios`, `Rooms`, `Equipments`의 `status` 컬럼은 Drizzle의 `pgEnum`으로 정의해 DB 레벨에서 타입 안전성을 확보합니다. (`pending | active | deny`)
- **images 컬럼**: ERD의 `text[] images`는 PostgreSQL의 `text[]` 배열 타입을 사용합니다. Drizzle에서는 `.array()` 메서드로 표현합니다.
- **Bookmarks 기본 키**: ERD에 명시적 PK가 없으나, `(user_id, studio_id)` 복합 기본 키로 설정해 중복 북마크를 DB 레벨에서 방지합니다.
- **마이그레이션 전략**: 개발 초기이므로 `db:push`(스키마 직접 적용)와 `db:generate` + `db:migrate`(마이그레이션 파일 생성 후 적용) 두 방식 모두 스크립트로 제공합니다.
- **Storage 버킷**: Supabase Storage에 `studio-images` 버킷을 생성하고, 공개 읽기(public) 정책을 설정합니다. 이미지 업로드 시 Presigned URL을 사용해 클라이언트에서 직접 업로드합니다.
