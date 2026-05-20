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


