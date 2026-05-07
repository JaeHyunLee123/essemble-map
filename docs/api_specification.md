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
      "images": ["url1", "url2"],
      "lat": 37.1234,
      "lng": 127.1234,
      "rooms": [
        {
          "id": "room-1",
          "name": "A룸 (대형)",
          "images": ["room_img1.jpg"],
          "pricePerHour": 15000,
          "minCapacity": 1,
          "maxCapacity": 10,
          "equipments": [
            {
              "id": "equip-1",
              "category": {
                "id": "cat-1",
                "name": "드럼"
              },
              "name": "DW Collector's",
              "imageUrl": "drum_img.jpg"
            }
          ]
        }
      ]
    }
  }
  ```

### 3.3 합주실 신규 제보
- **Endpoint:** `POST /studios/submit`
- **Authentication:** Required
- **Request Body (JSON):**
  - `name` (string): 합주실 이름
  - `mapUrl` (string, optional): 네이버 지도 URL
  - `description` (string): 설명
  - `imageUrls` (string[], optional): Presigned URL을 통해 클라이언트가 업로드 완료한 이미지 URL 목록
- **Response:** `201 Created`

### 3.4 특정 합주실에 방(Room) 추가 제보
- **Endpoint:** `POST /studios/:id/rooms`
- **Authentication:** Required
- **Request Body (JSON):**
  - `name` (string): 방 이름
  - `description` (string)
  - `pricePerHour` (number)
  - `minCapacity` (number)
  - `maxCapacity` (number)
  - `imageUrls` (string[])

### 3.5 특정 방에 장비(Equipment) 추가 제보
- **Endpoint:** `POST /rooms/:id/equipments`
- **Authentication:** Required
- **Request Body (JSON):**
  - `categoryId` (string): 장비 카테고리 ID
  - `name` (string): 장비명
  - `imageUrl` (string, optional)

---

## 4. 파일 업로드 API (Upload)

### 4.1 Presigned URL 요청
- **Endpoint:** `POST /upload/presigned-url`
- **Authentication:** Required
- **Request Body:**
  ```json
  {
    "filename": "my_image.png",
    "contentType": "image/png"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "uploadUrl": "https://...",
      "publicUrl": "https://..."
    }
  }
  ```

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
- `POST /studios/:id/bookmark`
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

### 7.1 수락 대기 중인 제보 목록 조회
- **Endpoint:** `GET /admin/submissions/pending`
- **Response:** (Studios, Rooms, Equipments의 pending 건을 통합 또는 분리하여 제공)

### 7.2 제보 상태 변경 (수락/거절)
- **Endpoint:** `PATCH /admin/submissions/:type/:id/status` (type: studio, room, equipment)
- **Request Body:**
  ```json
  {
    "status": "deny", // "active" | "deny"
    "denyReason": "잘못된 정보입니다." // status가 deny일 때만 필요
  }
  ```

### 7.3 장비 카테고리 관리 (CRUD)
- `POST /admin/categories` (생성)
- `PATCH /admin/categories/:id` (수정)
- `DELETE /admin/categories/:id` (삭제)
