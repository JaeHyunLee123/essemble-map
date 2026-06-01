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

# Phase 4: 지도 기반 합주실 조회 및 클러스터링 (Map) 체크리스트

## 1. API 구현 (`GET /api/studios/map`)
- [x] API 통합 테스트 코드 작성 (`tests/api/studios/map.test.ts`)
- [x] Bounding Box (neLat, neLng, swLat, swLng) 파싱 및 유효성 검사 로직 구현
- [x] Drizzle ORM을 활용하여 범위 내 `active` 상태 합주실 필터링 쿼리 구현
- [x] API 핸들러 구현 및 테스트 통과

## 2. 네이버 지도 기본 설정 및 렌더링
- [x] 네이버 지도 API Client ID 환경변수 설정 (`.env.local`)
- [x] `next/script`를 이용한 SDK 비동기 로드 및 `useRef` 기반 지도 인스턴스 초기화
- [x] 지도의 `dragend`, `zoom_changed` 이벤트에 디바운스(300ms) 적용 및 뷰포트 좌표 추출 로직 구현

## 3. 데이터 연동 및 마커 렌더링
- [x] `TanStack Query`를 사용하여 뷰포트 좌표 변경 시 API 호출 및 캐싱 로직 구현
- [x] 받아온 데이터를 지도 위에 바닐라 JS 커스텀 오버레이 방식으로 마커 렌더링
- [x] (임시) 기본 마커 표시 및 데이터 연동 확인

## 4. `supercluster` 클러스터링 구현
- [x] `supercluster` 패키지 설치
- [x] 합주실 데이터를 GeoJSON Feature 형식으로 변환 및 클러스터링 엔진 연동
- [x] 줌 레벨별 클러스터링 마커 렌더링 (숫자 표시 포함)
- [x] 클러스터 클릭 시 확장(Zoom-in) 또는 최대 줌 도달 시 목록 모달 표시 로직 구현

# Phase 5: 상세 정보 및 제보 (Studio) 체크리스트

## 1. 네이버 지도 링크 위경도 추출 라이브러리 (`src/lib/naverMap.ts`)
- [ ] 네이버 지도 단축 URL(`naver.me`) 리다이렉트 추적 로직 구현
- [ ] 최종 목적지 URL에서 플레이스 고유 ID(`placeId`) 파싱을 위한 정규표현식 구현
- [ ] 네이버 지도 내부 API(`https://map.naver.com/v5/api/sites/summary/{placeId}`) fetch 유틸리티 구현
- [ ] 위경도(x, y -> lat, lng) 파싱 및 유효성 검증 예외 처리 구현
- [ ] `naverMap.ts` 모듈에 대한 단위 테스트 작성 및 통과

## 2. 합주실 상세 조회 API (`GET /api/studios/:id`)
- [ ] 단일 합주실 조회 통합 테스트 작성 (`tests/api/studios/detail.test.ts`)
- [ ] Drizzle을 사용하여 단일 합주실 상세 레코드 조회 쿼리 구현
- [ ] JSON 응답 포맷에 추후 확장을 고려하여 빈 방 배열(`rooms: []`) 필드를 하드코딩하여 반환하도록 구성
- [ ] API 핸들러 구현 및 테스트 통과

## 3. 합주실 신규 제보 API (`POST /api/studios/submit`)
- [ ] 합주실 제보 API 통합 테스트 작성 (`tests/api/studios/submit.test.ts`)
- [ ] 입력값(`name`, `mapUrl`, `description`)의 유효성 검증 구현
- [ ] `naverMap.ts`를 활용하여 `mapUrl`로부터 위경도(`lat`, `lng`) 자동 추출 로직 연동
- [ ] 위경도 추출 실패 시 즉시 `400 Bad Request` 에러(안내 문구 포함)를 반환하는 예외 처리 구현
- [ ] 위경도 추출 성공 시 `images: []` 빈 배열 및 `status: "pending"` 상태로 DB 저장 구현
- [ ] API 핸들러 구현 및 테스트 통과

## 4. 프론트엔드 UI 연동
- [ ] 지도 마커 클릭 시 호출되는 합주실 상세 모달 컴포넌트(`StudioDetailModal`) 구현
- [ ] 상세 모달 내에서 방, 장비, 이미지 관련 UI 영역은 완전히 배제하고 합주실 이름, 설명, 네이버 지도 외부 링크 버튼만 렌더링하도록 폼 구성
- [ ] 로그인 유저 전용 북마크 토글 버튼 배치 및 낙관적 업데이트(Optimistic Update) 구현
- [ ] 합주실 제보 폼 모달 또는 페이지 개발 (이름, 설명, 네이버 지도 링크 입력 필드만 노출하며 이미지 업로드 기능 완전 배제)
- [ ] 제보 성공 시 안내 모달 및 파싱 실패 시 "유효한 네이버 지도 링크가 아닙니다." 토스트 알림 연동

# Phase 6: 마이페이지 체크리스트

## 1. 프로필 및 비밀번호 변경 API (TDD)
- [x] `tests/api/user/profile.test.ts` 작성 (닉네임 변경 및 중복 체크)
- [x] `src/app/api/user/profile/route.ts` 구현 및 테스트 통과
- [x] `tests/api/user/password.test.ts` 작성 (비밀번호 변경 및 bcrypt 검증)
- [x] `src/app/api/user/password/route.ts` 구현 및 테스트 통과

## 2. 북마크 및 제보 내역 조회 API (TDD)
- [x] `tests/api/user/bookmarks.test.ts` 작성 (active 합주실 북마크 목록 이너조인 조회)
- [x] `src/app/api/user/bookmarks/route.ts` 구현 및 테스트 통과
- [x] `tests/api/user/submissions.test.ts` 작성 (반려 사유 및 type: studio 포함 제보 내역 조회)
- [x] `src/app/api/user/submissions/route.ts` 구현 및 테스트 통과

## 3. 통합 인증 프록시 (TDD)
- [x] `tests/proxy.test.ts` 작성 (통합 인증 프록시 동작 검증)
- [x] `src/proxy.ts` (Next.js 16 Proxy) 구현 및 테스트 통과

## 4. 프론트엔드 UI 구성 (PascalCase)
- [x] `src/components/ProfileEditForm.tsx` (개인정보 수정 폼) 구현
- [x] `src/components/BookmarkList.tsx` (북마크 리스트) 구현
- [x] `src/components/SubmissionList.tsx` (제보 목록 및 상태 칩/반려 사유 툴팁) 구현
- [x] `src/app/mypage/page.tsx` (마이페이지 루트 및 탭 구조) 구현

## 5. 화이트모드 리디자인 및 글로벌 헤더 추가 (추가 요건)
- [ ] 글로벌 헤더 컴포넌트(`src/components/Header.tsx`) 신규 작성
- [ ] 루트 레이아웃(`src/app/layout.tsx`)에 글로벌 헤더 추가 및 통합
- [ ] 메인페이지(`src/app/page.tsx`)의 중복 헤더 및 AuthStatus 플로팅 UI 제거
- [ ] 마이페이지 루트(`src/app/mypage/page.tsx`) 화이트모드 전환 및 글로벌 헤더 겹침 보완을 위한 패딩 추가
- [ ] 프로필 수정 폼(`src/components/ProfileEditForm.tsx`) 화이트모드 카드 및 깔끔한 라이트 인풋 필드로 리디자인
- [ ] 북마크 리스트(`src/components/BookmarkList.tsx`) 화이트모드 카드 및 라이트 톤 호버 버튼 리디자인
- [ ] 제보 내역 리스트(`src/components/SubmissionList.tsx`) 화이트모드 카드 및 은은한 파스텔 톤 상태 배지 리디자인
- [ ] 전체 화이트모드 UI 및 헤더 인증(로그인, 로그아웃, 제보 모달 연동) 기능 매뉴얼 검증 완료
- [ ] 전체 Vitest 테스트 스위트 무결함 검증 통과
- [ ] 마이페이지 복귀 시 지도 미렌더링 오류 수정
    - [x] window.naver 전역 객체 체크를 통한 자동 지도 마운트 로직 작성
    - [x] 마이페이지 이동 후 재접속 시 정상 지도 노출 여부 수동 검증 완료
- [ ] 마이페이지 복귀 시 지도 조작 이벤트 미갱신 오류 해결
    - [ ] updateBounds 의존성 제거를 통한 useEffect 1회 격리화 구현
    - [ ] 마이페이지 이동 후 재접속 시 지도 드래그 및 줌 조작을 통한 목록 재로드 수동 검증 완료

# Phase 7: 어드민 페이지 체크리스트

## 1. 어드민 API 구현
- [x] 총 유저 수 조회 API (`GET /api/admin/stats`) 구현
- [x] 수락 대기 중인 합주실 제보 목록 조회 API (`GET /api/admin/studios/pending`) 구현
- [x] 승인 완료된 합주실 목록 조회 API (`GET /api/admin/studios/active`) 구현
- [x] 특정 합주실 상태(active, deny) 수락/반려/삭제 처리 API (`PATCH /api/admin/studios/:id/status`) 구현 (이미 active 상태인 건을 deny로 전달할 시 지도에서 내려가는 삭제 기능 수행)

## 2. 보안 설정 및 어드민 UI 구성
- [x] 회원가입 API(`POST /api/auth/register`) 내 `role` 강제 `'user'` 고정 처리 및 최초 어드민은 DB 수동 변경을 통해 지정하도록 설계
- [x] Next.js Middleware를 활용한 `/admin/*` 및 `/api/admin/*` 라우트의 어드민 역할(role === "admin") 검증 및 차단 처리 (`403 Forbidden` 및 홈 리다이렉트)
- [x] 어드민 전용 레이아웃 및 대시보드 UI 개발 (총 유저 수 통계 표시)
- [x] 제보 대기열(`pending`) 탭 및 승인 완료된 목록(`active`) 탭 전환 테이블 개발
- [x] 대기열 리스트 개별 행 클릭 시 상세 검토 팝업 모달 개발
- [x] 상세 검토 모달 내에 파싱된 위경도 좌표를 실시간 마킹하는 **좌표 검증용 미니 네이버 지도** 컴포넌트 임베딩 구현
- [x] 모달 내 [수락] 및 [거절] 액션 버튼 연동
- [x] 거절 액션 시 반려 사유 모달을 제공하며, 자주 쓰는 반려 사유 템플릿(상용구) 리스트 선택기 및 상세 사유 추가 입력 필드 조합 구현
- [x] 승인 완료된 목록 테이블의 각 행에 서비스 즉각 비활성화를 위한 [삭제] 버튼 배치 및 API 연동

## 3. 어드민 대시보드 로딩 오류 디버깅 및 세션 정합성 확보
- [x] Zustand `authStore` 초기화(`initialize`) 시 토큰 갱신 에러 발생 시 세션 리셋(`clearAuth` 연동) 처리
- [x] Zustand 스토어 인증 초기화 관련 단위 테스트 보강 및 무결함 검증
- [x] 실제 로컬 개발 서버 및 클라이언트 환경 E2E 상호작용 검증 완료

# Phase 8: 에이전트 협업 환경 구축 (Agent Skills Setup)

## 1. 에이전트 전용 스캐폴딩 설정
- [x] `docs/agents/issue-tracker.md` (GitHub 연동) 작성
- [x] `docs/agents/triage-labels.md` (Triage 표준 라벨) 작성
- [x] `docs/agents/domain.md` (단일 컨텍스트 도메인 가이드) 작성

## 2. 메인 에이전트 규칙 파일 연동
- [x] `AGENTS.md` 파일 내에 `## Agent skills` 매핑 규칙 추가
- [x] `docs/agents/domain.md` (단일 컨텍스트 도메인 가이드) 작성
- [x] `docs/checklist.md` 체크리스트 파일 최신화
- [x] `docs/context-notes.md` 컨텍스트 노트 최신화

# Phase 9: 북마크 아키텍처 개선 (Refactoring) 체크리스트

## 1. 신규 쿼리 및 뮤테이션 훅 구현
- [x] `src/hooks/queries/useBookmarks.ts` 신규 생성 및 한 줄 주석 추가
- [x] `useUserBookmarks` 쿼리 훅 구현 (active 합주실 북마크 목록 캐싱)
- [x] `useToggleBookmark` 뮤테이션 훅 구현 및 낙관적 업데이트 로직 적용
- [x] `["studio", studioId]` 및 `["userBookmarks"]` 캐시 동시 업데이트 및 에러 롤백 캡슐화

## 2. 컴포넌트 씸(Seam) 연동 및 리팩토링
- [x] `src/components/BookmarkList.tsx` 로컬 fetch 로직 제거 및 훅 연동
- [x] `src/components/StudioDetailModal.tsx` 인라인 뮤테이션 및 낙관적 업데이트 제거 후 훅 연동

## 3. 검증 및 무결성 확보
- [x] 전체 빌드 컴파일 무결성 검증 (`npm run build`)
- [x] Vitest 테스트 스위트 무결함 검증 (`npm test`)
- [x] 수동 E2E 인터랙션 검증 및 데이터 실시간 동기화 확인
