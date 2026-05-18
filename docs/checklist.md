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
