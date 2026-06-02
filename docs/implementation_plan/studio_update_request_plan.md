<!-- 합주실 정보 수정 요청 및 어드민 승인 프로세스 구현 계획 -->
# 합주실 정보 수정 요청 및 어드민 승인 구현 계획

본 문서는 일반 로그인 유저가 승인된 기존 합주실의 정보 수정을 요청하고, 어드민이 이를 검토 및 수정하여 승인 또는 반려하는 기능에 대한 아키텍처 및 구현 계획을 정의합니다.

## 1. 데이터베이스 스키마 설계

새로운 수정 요청을 독립적으로 추적하고 원본 데이터와의 동시성 격리를 보장하기 위해 신규 테이블을 추가합니다.

### 1.1 Enum 타입 및 테이블 스펙 (`src/db/schema.ts`)
- **`studio_update_request_status` Enum**
  - `pending` (대기 상태)
  - `approved` (수정 승인 완료)
  - `rejected` (수정 반려 상태)

- **`studio_update_requests` 테이블**
  - `id` (uuid, PK): 고유 ID
  - `studioId` (uuid, FK -> `studios.id`): 수정 대상 합주실 ID
  - `name` (varchar, 200, Not Null): 수정 제안 이름
  - `description` (text, Null 허용): 수정 제안 설명
  - `mapUrl` (text, Not Null): 수정 제안 네이버 지도 URL
  - `lat` (doublePrecision, Not Null): 수정 제안 위도
  - `lng` (doublePrecision, Not Null): 수정 제안 경도
  - `status` (Enum, Not Null, 기본값: `pending`): 요청 처리 상태
  - `denyReason` (text, Null 허용): 반려 시 사유
  - `createdBy` (uuid, FK -> `users.id`, Not Null): 요청 유저 ID
  - `createdAt` (timestamp, Not Null, 기본값: `now()`): 생성 일시
  - `updatedAt` (timestamp, Not Null, 기본값: `now()`): 수정 일시

---

## 2. 백엔드 API 설계

모든 API는 기존 인증 컨텍스트를 공유하며, 수정 제보 승인 시 위치 정보 재파싱 프로세스를 지원합니다.

### 2.1 유저용 API
1. **합주실 정보 수정 요청 등록 (`POST /api/studios/:id/update-request`)**
   - 사용자 입력을 검증하고 네이버 지도 링크(`mapUrl`)가 포함된 경우 위경도(`lat`, `lng`)를 파싱하여 `studio_update_requests` 테이블에 `pending` 상태로 인서트합니다.
2. **제보 내역 조회 확장 (`GET /api/user/submissions`)**
   - `studios` 테이블(신규 제보)과 `studio_update_requests` 테이블(정보 수정 요청)을 병합 쿼리하여 생성일 순으로 내림차순 정렬해 반환합니다.
   - 응답에 각 항목의 `type`(`"studio"` / `"studio_update_request"`)을 명시하여 클라이언트에서 렌더링을 구분하도록 합니다.

### 2.2 어드민용 API
1. **수정 요청 대기열 조회 (`GET /api/admin/studio-requests/pending`)**
   - `status = 'pending'` 인 수정 요청을 조회하며, 원본 합주실의 정보(`studios` 조인)를 함께 가져옵니다.
2. **수정 요청 상태 변경 및 승인 (`PATCH /api/admin/studio-requests/:id/status`)**
   - **반려 (`rejected`)**: 반려 사유(`denyReason`)를 저장하고 상태를 변경합니다.
   - **승인 (`approved`)**: 어드민이 최종 조율한 값(`name`, `description`, `mapUrl` 등)을 받아서 원본 `studios` 레코드를 수정(Update)하고, 수정 요청의 상태를 `approved`로 설정합니다. 지도 링크 수정 시 위경도 재파싱 과정을 거칩니다.
3. **신규 제보 일부 수정 후 승인 확장 (`PATCH /api/admin/studios/:id/status`)**
   - 기존의 승인 기능에 어드민이 편집한 필드값(`name`, `description`, `mapUrl`)을 선택적으로 덮어쓸 수 있도록 로직을 확장합니다.

---

## 3. 프론트엔드 UI/UX 설계

### 3.1 합주실 상세 모달 및 유저 수정 요청 폼
- **[정보 수정 제안] 버튼**: 합주실 상세 모달의 하단 영역에 배치합니다. 로그인 상태에서만 활성화되며, 비로그인 시 로그인 유도 팝업이 노출됩니다.
- **수정 요청 폼 모달**: 버튼 클릭 시 원본 합주실의 이름, 설명, 네이버 지도 링크가 사전에 입력된 상태로 모달이 열립니다. 입력 필드에 대한 변경 검증을 적용하여 변경점이 없는 경우 제출을 막습니다.

### 3.2 어드민 페이지 수정 요청 관리 탭
- **수정 요청 대기열 테이블**: 기존 어드민 페이지에 "수정 요청 대기열" 탭을 추가하여 승인 대기 중인 수정 요청 카드를 노출합니다.
- **검토 및 승인 편집 모달**: 특정 항목 클릭 시 다음과 같이 3분할 뷰를 제공합니다.
  - **좌측**: 현재 원본 정보(이름, 지도 링크, 설명, 네이버 미니 지도)
  - **중앙**: 유저가 수정 제안한 정보
  - **우측**: 최종 조율 필드(유저 제안 정보로 채워져 있으며 어드민이 임의로 편집할 수 있는 텍스트박스 인풋)
  - 하단에 [승인] 및 [반려] 버튼을 배치하여 처리할 수 있도록 조율합니다.

### 3.3 마이페이지 내역 표시
- 마이페이지 제보 내역 리스트 렌더링 컴포넌트가 `studio_update_request` 타입을 올바르게 식별하여 "수정 요청" 배지 및 수락/반려 상태(`Approved` / `Rejected`)를 올바르게 표시하도록 대응합니다.
