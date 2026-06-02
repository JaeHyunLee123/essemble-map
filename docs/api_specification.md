# 합주실 지도 서비스 API 명세서 (API Specification)

본 문서는 합주실 지도 서비스의 백엔드 API 규격을 정의합니다. 모든 API의 기본 경로는 `/api`입니다.

## 1. 공통 사항

### 1.1 기본 응답 형식
모든 응답은 JSON 형식을 사용합니다.

**성공 응답:**
```json
{
  "success": true,
  "data": { ... }
}
```

**에러 응답:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "사용자에게 보여줄 에러 메시지"
  }
}
```

### 1.2 인증 (Authentication)
- **Access Token:** 응답 본문으로 전달되며, 이후 요청의 `Authorization: Bearer <token>` 헤더에 포함합니다.
- **Refresh Token:** `HttpOnly`, `Secure` 쿠키로 설정되어 클라이언트 스크립트에서 접근할 수 없습니다.

---

## 2. 인증 API (Auth)

### 2.1 회원가입
- **Endpoint:** `POST /auth/register`
- **Request Body:**
  ```json
  {
    "username": "user123",
    "password": "password123!",
    "nickname": "베이스장인"
  }
  ```
- **Response:** `201 Created` / `400 Bad Request`
- **Security Constraint:** 
  - 클라이언트가 회원가입 시 임의의 `role` 값을 전달하더라도 백엔드 서버는 이를 철저히 무시하고 DB에 항상 `'user'` 권한으로 고정하여 저장해야 합니다.
  - 최초 어드민 계정 권한은 회원가입 완료 후 Supabase 또는 SQL 직접 쿼리를 통해 수동으로 `'admin'` 역할을 부여받아야 합니다.


### 2.2 로그인
- **Endpoint:** `POST /auth/login`
- **Request Body:**
  ```json
  {
    "username": "user123",
    "password": "password123!"
  }
  ```
- **Response:** `200 OK` (Set-Cookie 포함) / `401 Unauthorized`

---

## 3. 합주실 및 제보 API (Studios)

### 3.1 지도 영역 내 합주실 목록 조회 (active 상태만 반환)
- **Endpoint:** `GET /studios/map`
- **Query Parameters:**
  - `neLat` (float): 북동쪽 위도
  - `neLng` (float): 북동쪽 경도
  - `swLat` (float): 남서쪽 위도
  - `swLng` (float): 남서쪽 경도

### 3.2 합주실 상세 정보 조회
- **Endpoint:** `GET /studios/:id`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-1",
      "name": "낙원 합주실",
      "description": "최고의 시설...",
      "images": [],
      "lat": 37.1234,
      "lng": 127.1234,
      "rooms": []
    }
  }
  ```


### 3.3 합주실 신규 제보
- **Endpoint:** `POST /studios/submit`
- **Authentication:** Required
- **Request Body (JSON):**
  - `name` (string): 합주실 이름
  - `mapUrl` (string): 네이버 지도 URL (필수)
  - `description` (string, optional): 설명
- **Response:** `201 Created` / `400 Bad Request` (네이버 지도 파싱 실패 시)

### 3.4 합주실 정보 수정 요청 제출
- **Endpoint:** `POST /studios/:id/update-request`
- **Authentication:** Required
- **Request Body (JSON):**
  - `name` (string): 수정 제안할 합주실 이름
  - `mapUrl` (string): 수정 제안할 네이버 지도 URL (필수)
  - `description` (string, optional): 수정 제안할 설명
- **Response:** `201 Created` / `400 Bad Request` (네이버 지도 파싱 실패 시)

### 3.5 특정 합주실에 방(Room) 추가 제보 (MVP 제외)
- **Endpoint:** `POST /studios/:id/rooms` (이번 MVP 버전에서는 연동되지 않으며, 추후 고도화 시점에 구현함)

### 3.6 특정 방에 장비(Equipment) 추가 제보 (MVP 제외)
- **Endpoint:** `POST /rooms/:id/equipments` (이번 MVP 버전에서는 연동되지 않으며, 추후 고도화 시점에 구현함)


---

## 4. 파일 업로드 API (Upload) (MVP 제외)

이번 MVP 버전에서는 이미지 업로드 및 스토리지 연동을 모두 보류하므로, 관련 API(`POST /upload/presigned-url` 등)는 개발 범위에서 제외됩니다.


---

## 5. 공용 API (Public)

### 5.1 장비 카테고리 목록 조회
- **Endpoint:** `GET /categories`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      { "id": "cat-1", "name": "드럼" },
      { "id": "cat-2", "name": "기타 앰프" }
    ]
  }
  ```

---

## 6. 마이페이지 API (My Page)

### 6.1 북마크토글, 프로필 변경, 비밀번호 변경
- `POST /studios/:id/bookmark` (Active 상태인 합주실만 가능)
- `PATCH /user/profile`
- `PATCH /user/password`
- `GET /user/bookmarks`

### 6.2 내가 제보한 내역 조회
- **Endpoint:** `GET /user/submissions`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-studio-2",
        "type": "studio", // "studio" | "room" | "equipment"
        "name": "홍대 연습실",
        "status": "deny",
        "denyReason": "해당 주소에 합주실이 존재하지 않습니다.",
        "createdAt": "2026-05-07T..."
      }
    ]
  }
  ```

---

## 7. 어드민 API (Admin)

### 7.1 수락 대기 중인 합주실 제보 목록 조회
- **Endpoint:** `GET /admin/studios/pending`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-studio-1",
        "name": "낙원 합주실",
        "description": "최고의 시설...",
        "mapUrl": "https://map.naver.com/p/entry/place/12345",
        "createdAt": "2026-05-20T..."
      }
    ]
  }
  ```

### 7.2 승인 완료된 합주실 목록 조회 (관리용)
- **Endpoint:** `GET /admin/studios/active`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-studio-2",
        "name": "홍대 합주실",
        "description": "접근성 최고...",
        "mapUrl": "https://map.naver.com/p/entry/place/67890",
        "createdAt": "2026-05-21T..."
      }
    ]
  }
  ```

### 7.3 합주실 제보 상태 변경 (수락/거절/삭제) 및 정보 수정 승인
- **Endpoint:** `PATCH /admin/studios/:id/status`
- **Request Body:**
  ```json
  {
    "status": "active", // "active" | "deny"
    "denyReason": "잘못된 정보입니다.", // status가 deny일 때만 필요
    "name": "수정된 합주실 이름 (선택)",
    "description": "수정된 설명 (선택)",
    "mapUrl": "수정된 네이버 지도 URL (선택)"
  }
  ```
- **Description:** 
  - `pending` 상태의 합주실을 `active` 또는 `deny`로 상태 변경하여 승인/반려합니다.
  - 승인(`active`) 처리 시, `name`, `description`, `mapUrl` 등 어드민이 수정한 값을 바디로 함께 전달하면 원본 테이블에 해당 정보가 반영됩니다. (네이버 지도 URL 변경 시 위경도 자동 재계산 포함)
  - 이미 승인된(`active`) 합주실에 대해 이 API를 통해 `status`를 `deny`로 전송하면, 일반 유저 화면에서 노출되지 않는 '삭제/비활성화' 처리가 이루어집니다.

### 7.4 수락 대기 중인 합주실 수정 요청 목록 조회
- **Endpoint:** `GET /admin/studio-requests/pending`
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-request-1",
        "studioId": "uuid-studio-1",
        "originalStudio": {
          "name": "홍대 합주실 (기존)",
          "description": "접근성 최고... (기존)",
          "mapUrl": "https://map.naver.com/..."
        },
        "name": "홍대 합주실 (수정제안)",
        "description": "접근성 최고... (수정제안)",
        "mapUrl": "https://map.naver.com/...",
        "createdAt": "2026-06-02T..."
      }
    ]
  }
  ```

### 7.5 합주실 수정 요청 상태 변경 (수락/거절)
- **Endpoint:** `PATCH /admin/studio-requests/:id/status`
- **Request Body:**
  ```json
  {
    "status": "approved", // "approved" | "rejected"
    "denyReason": "반려 사유입니다.", // status가 rejected일 때만 필요
    "name": "최종 승인될 합주실 이름 (선택)",
    "description": "최종 승인될 설명 (선택)",
    "mapUrl": "최종 승인될 네이버 지도 URL (선택)"
  }
  ```
- **Description:**
  - 유저가 제출한 수정 요청서(Pending)의 상태를 `approved` 또는 `rejected`로 변경합니다.
  - `approved` 승인 처리 시, 최종 합의된 필드 값을 바탕으로 원본 합주실 레코드(`studios`) 정보를 업데이트하고 수정 요청서의 상태를 완료 처리합니다. (마찬가지로 네이버 지도 URL 변경 시 위경도 자동 재계산 포함)

### 7.6 장비 카테고리 관리 (CRUD) (MVP 제외)
- 이번 MVP 버전에서는 장비 카테고리 관리 기능을 제공하지 않으며, 향후 고도화 시점에 구현합니다.


