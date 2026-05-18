# Phase 2: 인증 로직 구현 (Auth) 체크리스트

## 1. 환경 설정 및 기초 작업
- [x] `bcrypt` (비밀번호 해싱) 및 `jsonwebtoken` (JWT 생성/검증) 설치
- [x] JWT 비밀키(`JWT_SECRET`) 환경변수 설정
- [x] API 응답 타입 정의 (Common Response 형식)

## 2. 회원가입 API (`POST /api/auth/register`)
- [x] 회원가입 테스트 코드 작성 (`src/app/api/auth/register/__tests__/register.test.ts`)
- [x] 아이디(`username`) 및 `nickname` 중복 검사 로직 구현
- [x] 비밀번호 해싱 (`bcrypt`) 적용
- [x] DB 유저 정보 저장 (`drizzle`)
- [x] API 핸들러 구현 및 테스트 통과

## 3. 로그인 API (`POST /api/auth/login`)
- [x] 로그인 테스트 코드 작성 (`src/app/api/auth/login/__tests__/login.test.ts`)
- [x] DB 조회 및 비밀번호 일치 확인 (`bcrypt.compare`)
- [x] Access Token 생성 (JSON 응답)
- [x] Refresh Token 생성 및 HttpOnly 쿠키 설정
- [x] API 핸들러 구현 및 테스트 통과

## 4. 프론트엔드 상태 관리 (Zustand)
- [x] `zustand` 설치
- [x] `useAuthStore` 구현 (`src/stores/authStore.ts`)
    - [x] `user` 상태 관리
    - [x] `accessToken` 상태 관리
    - [x] `login`, `logout` 액션 구현
    - [x] `silentRefresh` 로직 구현
- [x] 인증 스토어 단위 테스트 작성 (`src/stores/__tests__/authStore.test.ts`)

## 5. UI 구현
- [x] `shadcn/ui` 컴포넌트 추가 (`form`, `input`, `button`, `dialog`, `toast`)
- [x] 회원가입 폼 컴포넌트 개발
- [x] 로그인 폼 컴포넌트 개발
- [x] 회원가입/로그인 모달 또는 페이지 연동

## 6. 최종 검증
- [x] 전체 인증 플로우 E2E 테스트 또는 매뉴얼 테스트
- [x] `GEMINI.md` 준수 여부 확인 (한국어 주석 등)

# Phase 3: 초기 데이터 적재 (Crawler) 체크리스트

## 1. 환경 설정 및 기초 작업
- [x] `scripts/` 디렉터리 생성
- [x] `playwright`, `tsx`, `axios` 패키지 설치
- [x] Playwright 브라우저 설치 (`npx playwright install chromium`)
- [x] `scripts/crawler.ts` 기본 스켈레톤 및 실행 환경 구성 (`package.json` 스크립트 추가)

## 2. 유틸리티 구현 (다운로드/업로드 파이프라인)
- [x] `scripts/utils/storage.ts` 파일 생성
- [x] 외부 이미지 URL을 다운로드하여 ArrayBuffer로 변환 기능 구현
- [x] ArrayBuffer를 Supabase Storage (`studio-images` 버킷)에 업로드 및 Public URL 반환 기능 구현
- [x] 스토리지 유틸리티 단위 테스트 작성 (`scripts/utils/__tests__/storage.test.ts`) 및 TDD 검증

## 3. 크롤링 및 파싱 로직 구현 (Playwright)
- [x] 네이버 지도 검색 결과 스크래핑 로직 작성
- [x] 합주실 상세 정보(상호명, 위치, 가격, 장비, 이미지) 파싱 로직 작성
- [x] 크롤링 데이터를 Drizzle 스키마에 맞게 구조화

## 4. DB 일괄 삽입 (Seeding)
- [x] 시스템 어드민 계정 매핑 준비 (`created_by`)
- [x] Drizzle ORM `insert().values().onConflictDoNothing()` 활용하여 배치 삽입 로직 작성
- [x] 데이터 `status`를 `active`로 고정

## 5. 실행 및 최종 검증
- [ ] 전체 크롤러 실행 스크립트 작성 및 로그 확인
- [ ] Storage에 이미지가 정상 등록되었는지 확인
- [ ] DB에 연관관계에 맞게 데이터가 적재되었는지 검증
