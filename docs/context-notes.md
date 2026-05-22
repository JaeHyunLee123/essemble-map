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


# Phase 2: 인증 로직 구현 (Auth) 컨텍스트 노트

## 결정 사항 및 이유

### 1. 토큰 관리 방식
- **Access Token:** JSON 응답 본문(`data.accessToken`)으로 전달. 클라이언트에서는 Zustand 스토어와 메모리/로컬스토리지에 저장하여 API 요청 시 `Authorization` 헤더에 포함함.
- **Refresh Token:** `HttpOnly`, `Secure`, `SameSite=Strict` 쿠키로 설정. 클라이언트 스크립트에서 접근할 수 없게 하여 XSS 공격으로부터 보호함. CSRF 방지는 `SameSite=Strict`와 필요 시 추가적인 헤더 검증으로 처리.

### 2. 비밀번호 보안
- `bcrypt` 라이브러리를 사용하여 솔팅(Salting) 및 해싱 적용.
- 회원가입 시 해싱된 비밀번호만 DB에 저장함.

### 3. 상태 관리 (Zustand)
- `zustand`를 사용하여 가볍고 유연하게 인증 상태를 관리함.
- `persist` 미들웨어를 사용하여 로컬스토리지에 Access Token을 선택적으로 유지하거나, 앱 로드 시 Silent Refresh를 통해 갱신하는 전략 취함.

## 참고 자료
- `docs/api_specification.md`: API 규격 준수
- `docs/erd.md`: USERS 테이블 스키마 준수
- `docs/implementation_plan/auth_implementation_plan.md`: 인증 아키텍처 가이드라인


# Phase 3: 초기 데이터 적재 (Crawler) 컨텍스트 노트

## 결정 사항 및 이유

### 1. 스크립트 실행 환경
- `tsx`를 사용하여 스크립트를 직접 실행하도록 결정. TypeScript 설정(tsconfig.json) 및 Drizzle DB 모듈을 별도 컴파일 없이 직관적으로 사용할 수 있기 때문.

### 2. 크롤링 도구
- 네이버 지도 앱은 동적 렌더링을 심하게 사용하므로 정적 파싱(cheerio 등)으로는 한계가 있음. Playwright를 활용해 브라우저 환경을 직접 구동하고 요소를 스크래핑함.

### 3. 이미지 저장 방식
- 원본 네이버/외부 이미지 링크를 그대로 DB에 저장하면 엑스박스(403 Forbidden 등)가 발생할 수 있음. 따라서 스크래핑 시 `axios`나 `fetch`로 이미지를 `ArrayBuffer` 형태로 받아, 자체 Supabase Storage에 업로드하고 그 결과를 DB에 저장하도록 함.

### 4. 데이터 적재(Seeding) 방식
- 모든 크롤링 데이터는 시스템 어드민(`created_by`)의 소유로 처리하고, 즉시 지도에 노출되도록 상태를 `active`로 설정함.

# Phase 4: 지도 기반 합주실 조회 및 클러스터링 (Map) 컨텍스트 노트

## 결정 사항 및 이유

### 1. 바닐라 JS 방식의 지도 제어
- `react-naver-maps` 등의 라이브러리는 업데이트가 늦거나 세밀한 제어가 어려울 수 있음.
- `useRef`와 `next/script`를 사용하여 네이버 지도 인스턴스를 직접 제어함으로써 성능 최적화와 자유로운 커스터마이징을 도모함.

### 2. 클라이언트 사이드 클러스터링 (`supercluster`)
- 서버 부하를 줄이고 빠른 반응 속도를 위해 클라이언트에서 클러스터링을 처리함.
- `supercluster`는 GeoJSON 기반으로 수만 개의 데이터를 매우 빠르게 처리할 수 있어 적합함.

### 3. 동일 좌표 처리 로직
- 네이버 지도의 최대 줌 레벨(21)에 도달했음에도 클러스터가 존재할 경우(즉, 정확히 같은 좌표의 합주실들), 더 이상 확대하지 않고 목록 UI를 제공하여 사용자 경험을 개선함.

### 4. Bounding Box 기반 데이터 요청
- 전체 데이터를 한 번에 가져오지 않고, 현재 화면에 보이는 영역(`neLat`, `neLng`, `swLat`, `swLng`)에 해당하는 데이터만 요청하여 네트워크 비용 및 렌더링 부하를 최소화함.


# Phase 5: 상세 정보 및 제보 (Studio) 컨텍스트 노트

## 결정 사항 및 이유

### 1. 네이버 지도 링크 기반 위경도 자동 추출
- 유저 제보 시 위경도나 주소를 직접 입력받는 대신 네이버 지도 링크만 제출받음으로써 복잡한 주소 입력 컴포넌트나 지도 핀 드래그 UI를 제거하고 폼을 극도로 단순화함.
- 백엔드에서 `naver.me` 단축 URL의 리다이렉션을 따라가 풀 URL을 획득하고, 그로부터 플레이스 고유 ID를 파싱해 네이버 웹 내부 API를 호출함. 이를 통해 WGS84 위도, 경도 좌표를 정밀하게 획득하여 DB에 저장함.
- 비공식 API 연동 실패 혹은 유효하지 않은 주소 입력 시 즉시 400 에러를 반환하여 제보 자체를 반려하고 데이터베이스에 지리 정보가 누락되는 일이 없도록 보장함.

### 2. 방(Room) 및 이미지 업로드 완전 보류
- 개발 속도와 우선순위를 극대화하기 위해 MVP 릴리즈 범위에서 이미지 업로드 인프라(Supabase Storage 버킷 쓰기 및 Presigned URL API)와 방/장비 관리 로직을 배제함.
- 이미지는 빈 배열(`[]`)로 DB에 하드코딩 저장하고, 제보 폼 UI 역시 이름, 설명, 지도 링크로 제한함.

### 3. 상세 조회 응답 호환성 유지
- 프론트엔드 UI에서는 방 정보 영역을 렌더링하지 않지만, 백엔드 API인 `GET /api/studios/:id` 응답에는 빈 배열(`rooms: []`) 형태의 포맷을 명시적으로 내려주도록 설계하여 추후 고도화 시 스펙 충동을 예방함.

# Phase 6 & 7: 마이페이지 및 어드민 페이지 컨텍스트 노트

## 결정 사항 및 이유

### 1. 제보 및 승인 엔드포인트 단순화
- 방과 장비 제보가 이번 MVP에서 제외됨에 따라 어드민 제보 대기열 및 수락/거절 API를 오직 합주실(`studios`) 기준으로 축소 및 단순화함. `submissions/:type/:id` 경로 대신 `studios/:id/status` 경로를 적용하여 보일러플레이트 코드를 줄임.
- 마이페이지 내 제보 내역 조회 API(`GET /api/user/submissions`) 역시 합주실 제보 건만 쿼리하도록 단순화함.

### 2. Edge Runtime 호환 통합 인증 프록시 (Next.js 16 Proxy)
- `src/proxy.ts`는 V8 Edge Sandbox 환경에서 작동하므로 Node.js의 내장 모듈에 의존하는 `jsonwebtoken` 패키지 사용 시 컴파일 및 실행 타임 에러가 발생함.
- 이를 우회하기 위해, 외부 라이브러리 없이 순수 JavaScript(atob, decodeURIComponent)만을 사용하는 초경량 JWT Base64 디코딩 및 만료일(`exp`), 권한(`role`)을 검증하는 커스텀 Edge-safe 파서를 설계하여 성능과 규격 안전성을 극대화함.

### 3. 북마크 목록 조회 시 이너조인(Inner Join) 및 active 조건 필터링
- 유저가 마이페이지에서 북마크한 합주실을 볼 때, DB 성능을 최적화하기 위해 `bookmarks`와 `studios` 테이블을 이너조인(Inner Join) 처리하여 조회함.
- 이때 승인 완료(`active`) 상태가 아닌 임시 저장 혹은 반려된 합주실 정보가 노출되지 않도록 `studios.status = 'active'` 필터링을 강력하게 적용함.

### 4. 제보 내역 조회 시 확장성 유지
- 현재 MVP 범위에서는 합주실 제보만 이루어지나, 미래의 방(Room)/장비(Equipment) 제보 확장에 대비하여 각 항목마다 `"type": "studio"` 기본 고정 속성을 탑재하여 안전하게 반환함.
- 반려(`deny`)된 제보 건에 대해서는 반려 사유(`denyReason`)를 반환 객체에 명시적으로 추가하여, 프론트엔드 UI 카드에서 유저에게 즉각 가이드 텍스트 형태로 아름답게 시각화함.

### 5. 프론트엔드 UI 컴포넌트 구조화 및 PascalCase 명규칙
- `ProfileEditForm`, `BookmarkList`, `SubmissionList` 등 모든 신규 컴포넌트의 파일명을 PascalCase로 구성하여 Next.js 모범 사례를 준수함.
- 각 컴포넌트에는 세련된 어두운 유리모사(Glassmorphism) 효과와 부드러운 호버링 상태 변화를 주어 극도의 시각적 고품격을 달성함.

### 6. 마이페이지 화이트모드 리디자인 및 글로벌 헤더(Header.tsx) 도입
- **헤더 스타일 선택.** 1번 스타일인 Fixed Transparent Backdrop Header 방식을 도입하여 지도가 화면 전체에 펼쳐진 상황에서도 자연스러운 일체감과 세련미를 선사합니다.
- **글로벌 헤더 통합과 레이아웃 관리.** 기존 메인페이지에만 absolute로 떠 있던 인증 컴포넌트(AuthStatus 등)를 글로벌 헤더로 통합 승격하였습니다. 이에 따라 모든 페이지(메인, 마이페이지 등)에서 통일된 헤더가 최상단에 고정 렌더링되며, 마이페이지에는 헤더 크기만큼의 상단 패딩(`pt-24`)을 부여하여 콘텐츠가 겹치지 않게 레이아웃을 안전하게 배치합니다.
- **인터페이스 편의성 향상.** 헤더 내에 닉네임과 역할(role) 표시 외에도 로그인 유저 대상의 "합주실 제보" 액션 버튼을 통합하여, 기존 메인페이지의 제보 트리거 역할을 완벽하게 대체할 수 있도록 구현합니다.
- **화이트모드(라이트 테마) 글래스모피즘 미학.** 마이페이지와 그 산하 닉네임/비밀번호 변경 폼, 북마크 카드, 제보 목록은 기존 다크 컨셉에서 벗어나 투명하고 현대적인 화이트 톤으로 전면 교체합니다. 연한 그레이 및 은은한 에메랄드/소프트 로즈 톤의 그림자와 투명 보더 효과를 입혀, 시각적으로 깔끔하면서도 인터랙티브하고 우아한 프리미엄 UI를 선사합니다.
- **반려 사유 및 상태 배지의 감각적 재탄생.** 제보 목록의 상태 배지(승인 완료, 반려됨, 검토 중)에 은은한 파스텔 배경 색상과 선명하지만 자극적이지 않은 텍스트 톤을 대입하여 라이트 테마 내 가독성과 정보 전달 직관성을 극대화합니다. 반려 사유 박스는 은은한 파스텔 로즈 톤으로 처리하여 중요한 피드백을 사용자에게 정갈하게 전달합니다.

### 7. 마이페이지 복귀 시 지도 미렌더링 오류 수정
- **Next.js SPA 네비게이션 특성 파악.** Next.js의 클라이언트 사이드 라우팅 시 한 번 로딩된 스크립트 컴포넌트는 다시 `onLoad` 콜백을 트리거하지 않습니다. 따라서 페이지 복귀 시 컴포넌트가 새로 마운트되면 `isLoaded`가 `false` 상태로 멈추는 한계가 있었습니다.
- **전역 window.naver 감지.** 컴포넌트가 마운트될 때 `window.naver` 객체가 이미 전역 메모리에 적재되어 있는지 확인하여, 적재된 경우 즉시 `isLoaded` 상태를 `true`로 설정해 지도가 즉각 초기화되도록 조치합니다.
- **예외 상태 격리.** 스크립트의 `onLoad` 로직과 마운트 체크 로직을 원활하게 결합하여 최초 로드와 재방문 마운트 상황을 모두 완벽하게 보장합니다.
- **지도 조작 이벤트 유실 문제 발견.** 메인페이지 복귀 시 `isLoaded`가 즉시 `true`가 되면서 첫 렌더링에 지도가 생성되고 `updateBounds()`가 즉각 실행되는데, 이 과정에서 부모의 `onBoundsChange`가 갱신되어 `updateBounds` useCallback 참조가 바로 바뀝니다. 이에 따라 지도 생성 `useEffect`가 의존성 변경으로 즉시 재실행되고, 재실행 직전 cleanup이 방금 등록한 지도 리스너들을 소거해버렸습니다. 재실행된 `useEffect`는 `mapRef.current`가 이미 준비되어 있어 조기 리턴함으로써, 리스너가 유실된 지도가 남아 조작에 따른 목록 갱신이 불가능했던 현상입니다.
- **useEffect 1회 격리화 전략.** 지도 초기화 `useEffect` 내에서 변동성이 극심한 `updateBounds` prop 참조 대신, `updateBoundsRef.current()` 간접 참조를 사용하여 호출하게 함으로써 의존성을 전면 배제했습니다. 의존성 배열에서 `updateBounds`를 제거해 생애 주기 중 최초 1회만 지도가 온전히 생성되도록 보장하여, 중간 이벤트 클린업에 의한 리스너 유실 현상을 완벽히 방어했습니다.



