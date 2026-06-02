<!-- 합주실 지도 앱의 전체 구현 계획 및 체크리스트 -->

# 전체 구현 계획 및 체크리스트 (Implementation Plans)

이 문서는 합주실 지도 서비스의 전체 개발 로드맵과 구체적인 작업 체크리스트를 관리합니다. 각 주요 기능별 상세 구현 계획은 아래 링크된 개별 문서를 참고해 주십시오.

7: ## 🔗 파트별 상세 구현 계획 문서
8: 
9: - [인증 및 DB 설정 계획](./auth_implementation_plan.md)
10: - [데이터 크롤러 및 적재 계획](./crawler_implementation_plan.md)
11: - [지도 및 클러스터링 계획](./map_implementation_plan.md)
12: - [합주실 정보 및 제보 계획](./studio_implementation_plan.md)
13: - [마이페이지 및 유저 기능 계획](./user_implementation_plan.md)
14: - [어드민 페이지 기능 계획](./admin_implementation_plan.md)
15: - [합주실 정보 수정 요청 및 승인 계획](./studio_update_request_plan.md)
16: - [테스트 개발 및 고도화 계획](./test_implementation_plan.md)
17: 
18: ---

## 📝 핵심 구현 지침 (Guidelines)

- **DB 스키마 및 API 구현 시:** 코드를 작성할 때는 반드시 `erd.md`와 `api_specification.md` 문서를 기준으로 참조하여 스펙이 완전히 일치하도록 구현해야 합니다.
- **TDD 기반 개발:** 모든 기능 구현은 반드시 [test_implementation_plan.md](./test_implementation_plan.md)의 지침에 따라 TDD(Test-Driven Development) 방식으로 진행되어야 합니다.
- **MVP 스코프 제외 대상(Out of Scope):** 일반 유저가 이미 승인된(Active) 합주실, 방, 장비의 "수정"을 제안(Update Request)하는 기능은 제외됩니다. 또한 이번 MVP 릴리즈 버전에서는 방(Room), 장비(Equipment) 정보의 상세 렌더링 및 개별 제보 기능, 이미지 업로드 전반의 인프라와 API(`POST /api/upload/presigned-url` 등)를 구현 범위에서 보류합니다. 단, 상세 조회 API(`GET /api/studios/:id`)의 JSON 응답 스펙에만 추후 확장을 고려해 `rooms: []` 빈 배열을 유지합니다.

---

## ✅ 개발 체크리스트

### Phase 1: 환경 설정 및 기본 인프라 구성

- [x] Next.js 프로젝트 생성 및 기본 패키지 설치 (TailwindCSS, Drizzle ORM 등)
- [x] Supabase 프로젝트 생성 및 데이터베이스 연결
- [x] Drizzle 스키마 정의 (`Users`, `Studios`, `Rooms`, `EquipmentCategories`, `Equipments`, `Bookmarks`)
- [x] DB 마이그레이션 실행 및 Supabase Storage(버킷) 생성

### Phase 2: 인증 로직 구현 (Auth) - [상세 문서](./auth_implementation_plan.md)

- [x] `POST /api/auth/register` API 구현 (비밀번호 해싱, 닉네임 중복 체크)
- [x] `POST /api/auth/login` API 구현 (Access Token JSON 반환, Refresh Token HttpOnly 쿠키 설정)
- [x] 클라이언트 전역 상태 설정 (Zustand Auth Store)
- [x] 회원가입 및 로그인 모달/페이지 UI 구현

### Phase 3: 초기 데이터 적재 (Crawler) - [상세 문서](./crawler_implementation_plan.md)

- [x] `scripts/crawler.ts` 설정 및 Playwright 세팅
- [x] 네이버 지도 합주실 검색 및 파싱 로직 작성
- [x] 이미지 URL 다운로드 및 Supabase Storage 업로드 유틸리티 작성
- [x] 크롤링된 데이터를 Drizzle을 통해 DB에 일괄 삽입(Seeding)

### Phase 4: 지도 및 마커 렌더링 (Map) - [상세 문서](./map_implementation_plan.md)

- [x] 네이버 지도 API 클라이언트 설정 및 화면 렌더링
- [x] `GET /api/studios/map` API 구현 (Bounding Box 파라미터로 위경도 데이터 필터링)
- [x] 지도 Pan/Zoom 이벤트에 Debounce(0.3s) 적용하여 API 호출
- [x] TanStack Query를 이용한 서버 상태 캐싱
- [x] 마커 클러스터링 로직 구현 및 지도 렌더링

### Phase 5: 상세 정보 및 제보 (Studio) - [상세 문서](./studio_implementation_plan.md)

- [x] `GET /api/studios/:id` API 구현 (단일 합주실 정보 조회, `rooms: []` 빈 배열 응답 유지)
- [x] 지도 마커 클릭 시 합주실 상세 정보 모달 UI 구현 (이름, 설명, 지도 링크 버튼으로 구성, 방/장비 및 이미지 영역 배제)
- [x] 북마크 기능 API 및 UI 연동 (로그인 유저 전용)
- [x] `POST /api/studios/submit` API 구현 (네이버 지도 링크 분석 및 리다이렉트 추적, 내부 플레이스 API 조회를 통해 lat/lng 자동 추출 및 저장, 실패 시 400 에러 반환)
- [x] 합주실 제보 폼 UI 구현 (합주실 이름, 설명(선택), 네이버 지도 링크 입력 필드로 구성, 이미지 업로드 배제)

### Phase 6: 마이페이지 및 통합 인증 프록시 구현 - [상세 문서](./user_implementation_plan.md)

- [ ] Next.js 16의 `proxy.ts`를 생성하여 마이페이지 및 어드민 보호 라우트 통합 인증 제어 구현
- [ ] `PATCH /api/user/profile` (닉네임 변경), `PATCH /api/user/password` (비밀번호 변경) API 구현
- [ ] `GET /api/user/bookmarks` (북마크 목록 - active 필터 적용), `GET /api/user/submissions` (제보 내역 - deny 상태 및 반려 사유 포함) API 구현
- [ ] 마이페이지 UI (개인정보 수정, 북마크 목록, 제보 내역 탭 - 반려 사유 노출 포함) 구현

### Phase 7: 어드민 페이지 - [어드민 상세](./admin_implementation_plan.md)

- [ ] `GET /api/admin/stats` (총 유저 수 조회) API 구현
- [ ] `GET /api/admin/studios/pending` (대기 중인 합주실 제보 목록 조회) API 구현 (방/장비 제보 배제)
- [ ] `GET /api/admin/studios/active` (승인 완료된 합주실 목록 조회) API 구현
- [ ] `PATCH /api/admin/studios/:id/status` (합주실 제보 수락/거절 및 승인 완료된 합주실 삭제 처리) API 구현
- [ ] `proxy.ts` 기반의 어드민 라우트 보호 및 Role 검증 연동 (회원가입 시 role은 항상 user로 강제 고정)
- [ ] 어드민 대시보드 UI (통계, 대기열 및 승인 완료 리스트 렌더링, 액션 버튼 이벤트) 구현
- [ ] 상세 검토 모달 내 좌표 검증용 미니 네이버 지도 컴포넌트 임베딩 구현
- [ ] 반려 처리 모달 내 자주 쓰는 반려 사유 템플릿(상용구) 선택 리스트 및 텍스트 조합 입력 폼 구현


