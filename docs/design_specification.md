<!-- 합주실 지도 앱의 최종 아키텍처 및 요구사항 설계 명세서 -->
# 합주실 지도 서비스 설계 명세서 (Design Specification)

## 1. 개요 (Understanding Summary)
* **무엇을 만드나요:** 전국 수천~수만 개의 합주실 위치와 상세 정보(방, 가격, 보유 장비 등)를 직관적으로 제공하는 네이버 지도 기반 웹 애플리케이션.
* **왜 만드나요:** 파편화된 합주실 정보들을 모아 한눈에 쉽게 찾고, 북마크 및 제보할 수 있는 통합 플랫폼 제공.
* **누구를 위한 서비스인가요:** 조건에 맞는 합주실을 빠르고 쉽게 찾고자 하는 밴드 및 뮤지션.
* **주요 제약 및 기술적 고려사항:**
  * 대규모 마커 렌더링을 위한 **마커 클러스터링(Clustering)** 및 **뷰포트 기반 API 쿼리** 필수.
  * 유저 이미지 제보 시 **직접 파일 업로드** 및 **URL 입력 변환**을 모두 지원하여 Supabase Storage에 일괄 저장.
* **명시적 비목표 (Non-goals):**
  * 결제, 실시간 예약(Booking) 기능 제외 (초기 MVP 기준 정보 제공 및 커뮤니티 성격에 집중).

## 2. 주요 가정 사항 (Assumptions)
* **인증 (Authentication):** JWT 기반 자체 인증 로직 사용 (Access Token은 클라이언트 메모리/로컬스토리지, Refresh Token은 HttpOnly 쿠키).
* **관리자(Admin) 플로우:** 유저가 제보한 데이터는 `pending` 상태로 저장되며 일반 지도에 노출되지 않음. 추후 어드민이 이를 승인해야 `active`로 전환됨.
* **배포 및 아키텍처:** 별도의 백엔드 인스턴스 없이 Next.js API Routes 및 Supabase(PostgreSQL + Storage) 기반의 Serverless 구조 사용.

## 3. 의사 결정 로그 (Decision Log)
1. **이미지 저장소 일원화:** 외부 URL 이미지 의존성을 끊기 위해, 제출된 이미지 URL은 서버에서 다운로드 후 Supabase Storage에 저장하기로 결정.
2. **크롤링 스크립트 모노레포 통합:** 유지보수 및 ORM 스키마 공유를 위해 Next.js 레포지토리 내부에 Node.js 기반(Playwright 등) 크롤러 스크립트를 위치시키기로 결정.
3. **장비 유형 테이블 분리:** 유연한 확장성을 위해 PostgreSQL 고정 ENUM 대신, `EquipmentCategories` 테이블을 별도로 분리하여 어드민이 나중에 유형을 동적으로 추가할 수 있도록 결정.

## 4. 최종 시스템 설계 (Final Design)

### 4.1 데이터 모델 구조 (Drizzle ORM)
* **Users:** id, username, password(hashed), nickname, role
* **Studios:** id, name, map_url, description, images(url array), lat, lng, status(pending/active), created_by
* **Rooms:** id, studio_id, images, price_per_hour, min_capacity, max_capacity, description
* **EquipmentCategories:** id, type_name (ex. 드럼, 기타 앰프)
* **Equipments:** id, room_id, category_id, name, image_url
* **Bookmarks:** user_id, studio_id

### 4.2 아키텍처 및 데이터 흐름
* **초기 적재 (Crawler):** `scripts/crawler.ts` -> 네이버 지도 파싱 -> 이미지 Supabase Storage 업로드 -> Drizzle ORM으로 DB INSERT.
* **데이터 조회 (Read):** 지도를 0.3초(Debounce) 이상 정지 시 현재 화면 좌표(Bounding Box) 기준으로 `GET /api/studios/map` 호출. 최소 정보(위경도, ID 등)만 가져와 클라이언트에 캐싱(Tanstack Query) 및 클러스터링 적용.
* **상세 조회 (Read Detail):** 유저가 특정 마커 클릭 시 `GET /api/studios/:id` 호출하여 해당 합주실의 모든 방과 장비 정보를 조인하여 반환.
* **제보 (Write):** 폼 제출 시 파일 업로드 또는 URL 다운로드 스트리밍 후 Supabase Storage 적재. DB에 `pending` 상태로 INSERT.

### 4.3 테스트 및 모니터링
* **테스트:** 핵심 유틸리티(이미지 변환, 토큰 검증 등)는 Vitest로 검증. 전체 유저 플로우(로그인 -> 맵 탐색 -> 제보)는 Playwright E2E 테스트 구성.
* **모니터링:** PostHog을 연동하여 유저의 주요 클릭 이벤트와 지도 탐색 영역을 트래킹.
