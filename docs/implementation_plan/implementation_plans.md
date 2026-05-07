<!-- 합주실 지도 앱의 전체 구현 계획 및 체크리스트 -->
# 전체 구현 계획 및 체크리스트 (Implementation Plans)

이 문서는 합주실 지도 서비스의 전체 개발 로드맵과 구체적인 작업 체크리스트를 관리합니다. 각 주요 기능별 상세 구현 계획은 아래 링크된 개별 문서를 참고해 주십시오.

## 🔗 파트별 상세 구현 계획 문서
* [인증 및 DB 설정 계획](./auth_implementation_plan.md)
* [데이터 크롤러 및 적재 계획](./crawler_implementation_plan.md)
* [지도 및 클러스터링 계획](./map_implementation_plan.md)
* [합주실 정보 및 제보 계획](./studio_implementation_plan.md)
* [마이페이지 및 유저 기능 계획](./user_implementation_plan.md)
* [어드민 페이지 기능 계획](./admin_implementation_plan.md)
* [테스트 개발 및 고도화 계획](./test_implementation_plan.md)

---

## 📝 핵심 구현 지침 (Guidelines)
- **DB 스키마 및 API 구현 시:** 코드를 작성할 때는 반드시 `erd.md`와 `api_specification.md` 문서를 기준으로 참조하여 스펙이 완전히 일치하도록 구현해야 합니다.
- **TDD 기반 개발:** 모든 기능 구현은 반드시 [test_implementation_plan.md](./test_implementation_plan.md)의 지침에 따라 TDD(Test-Driven Development) 방식으로 진행되어야 합니다.

---

## ✅ 개발 체크리스트

### Phase 1: 환경 설정 및 기본 인프라 구성
- [x] Next.js 프로젝트 생성 및 기본 패키지 설치 (TailwindCSS, Drizzle ORM 등)
- [ ] Supabase 프로젝트 생성 및 데이터베이스 연결
- [ ] Drizzle 스키마 정의 (`Users`, `Studios`, `Rooms`, `EquipmentCategories`, `Equipments`, `Bookmarks`)
- [ ] DB 마이그레이션 실행 및 Supabase Storage(버킷) 생성

### Phase 2: 인증 로직 구현 (Auth) - [상세 문서](./auth_implementation_plan.md)
- [ ] `POST /api/auth/register` API 구현 (비밀번호 해싱, 닉네임 중복 체크)
- [ ] `POST /api/auth/login` API 구현 (Access Token JSON 반환, Refresh Token HttpOnly 쿠키 설정)
- [ ] 클라이언트 전역 상태 설정 (Zustand Auth Store)
- [ ] 회원가입 및 로그인 모달/페이지 UI 구현

### Phase 3: 초기 데이터 적재 (Crawler) - [상세 문서](./crawler_implementation_plan.md)
- [ ] `scripts/crawler.ts` 설정 및 Playwright 세팅
- [ ] 네이버 지도 합주실 검색 및 파싱 로직 작성
- [ ] 이미지 URL 다운로드 및 Supabase Storage 업로드 유틸리티 작성
- [ ] 크롤링된 데이터를 Drizzle을 통해 DB에 일괄 삽입(Seeding)

### Phase 4: 지도 및 마커 렌더링 (Map) - [상세 문서](./map_implementation_plan.md)
- [ ] 네이버 지도 API 클라이언트 설정 및 화면 렌더링
- [ ] `GET /api/studios/map` API 구현 (Bounding Box 파라미터로 위경도 데이터 필터링)
- [ ] 지도 Pan/Zoom 이벤트에 Debounce(0.3s) 적용하여 API 호출
- [ ] TanStack Query를 이용한 서버 상태 캐싱
- [ ] 마커 클러스터링 로직 구현 및 지도 렌더링

### Phase 5: 상세 정보 및 제보 (Studio) - [상세 문서](./studio_implementation_plan.md)
- [ ] `GET /api/studios/:id` API 구현 (방 및 장비 정보 조인)
- [ ] 지도 마커 클릭 시 합주실 상세 정보 모달 UI 구현
- [ ] 북마크 기능 API 및 UI 연동 (로그인 유저 전용)
- [ ] `POST /api/studios/submit` API 구현 (이미지 업로드 및 URL 변환 처리)
- [ ] 합주실 제보 폼 UI 구현

### Phase 6: 마이페이지 - [상세 문서](./user_implementation_plan.md)
- [ ] `PATCH /api/user/profile` (닉네임 변경), `PATCH /api/user/password` (비밀번호 변경) API 구현
- [ ] `GET /api/user/bookmarks` (북마크 목록), `GET /api/user/submissions` (제보 내역) API 구현
- [ ] 마이페이지 UI (개인정보 수정, 목록 조회 탭) 구현


### Phase 7: 어드민 페이지 - [어드민 상세](./admin_implementation_plan.md)
- [ ] `GET /api/admin/stats` (총 유저 수 조회) API 구현
- [ ] `GET /api/admin/studios/pending` (대기 중인 합주실 목록) API 구현
- [ ] `PATCH /api/admin/studios/:id/status` (합주실 수락/거절 상태 변경) API 구현
- [ ] 미들웨어를 활용한 어드민 라우트 보호 (Role 검증)
- [ ] 어드민 대시보드 UI (통계 및 대기열 리스트 렌더링, 수락/거절 버튼 이벤트) 구현

