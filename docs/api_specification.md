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
- **Response:**
  - `201 Created`: 회원가입 성공
  - `400 Bad Request`: 중복된 아이디 또는 닉네임

### 2.2 로그인
- **Endpoint:** `POST /auth/login`
- **Request Body:**
  ```json
  {
    "username": "user123",
    "password": "password123!"
  }
  ```
- **Response:**
  - `200 OK`: 로그인 성공 (Set-Cookie 포함)
    ```json
    {
      "success": true,
      "data": {
        "accessToken": "ey...",
        "user": {
          "id": 1,
          "username": "user123",
          "nickname": "베이스장인",
          "role": "USER"
        }
      }
    }
    ```
  - `401 Unauthorized`: 아이디 또는 비밀번호 불일치

---

## 3. 합주실 API (Studios)

### 3.1 지도 영역 내 합주실 목록 조회
- **Endpoint:** `GET /studios/map`
- **Query Parameters:**
  - `neLat` (float): 북동쪽 위도
  - `neLng` (float): 북동쪽 경도
  - `swLat` (float): 남서쪽 위도
  - `swLng` (float): 남서쪽 경도
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-1",
        "name": "낙원 합주실",
        "lat": 37.1234,
        "lng": 127.1234
      }
    ]
  }
  ```

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
          "description": "최대 10인 수용 가능한 넓은 합주실입니다.",
          "images": ["room_img1.jpg", "room_img2.jpg"],
          "pricePerHour": 15000,
          "minCapacity": 1,
          "maxCapacity": 10,
          "equipments": [
            { "category": "드럼", "name": "DW Collector's", "imageUrl": "drum_img.jpg" },
            { "category": "기타 앰프", "name": "Marshall JCM2000", "imageUrl": "amp_img.jpg" }
          ]
        }
      ]
    }
  }
  ```

### 3.3 합주실 제보
- **Endpoint:** `POST /studios/submit`
- **Authentication:** Required (Bearer Token)
- **Request Body (Multipart/form-data):**
  - `name` (string): 합주실 이름
  - `mapUrl` (string, optional): 네이버 지도 URL
  - `description` (string): 설명
  - `images` (file[], optional): 업로드할 이미지 파일들
  - `imageUrlStrings` (string[], optional): 외부 이미지 URL 목록
- **Response:**
  - `201 Created`: 제보 성공 (상태는 `pending`)

---

## 4. 유저 활동 API (User Actions)

### 4.1 북마크 토글
- **Endpoint:** `POST /studios/:id/bookmark`
- **Authentication:** Required (Bearer Token)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "isBookmarked": true
    }
  }
  ```

---

## 5. 마이페이지 API (My Page)

### 5.1 회원 정보 수정 (닉네임 변경)
- **Endpoint:** `PATCH /user/profile`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "nickname": "새로운닉네임"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-user-1",
      "username": "user123",
      "nickname": "새로운닉네임",
      "role": "user"
    }
  }
  ```

### 5.2 비밀번호 변경
- **Endpoint:** `PATCH /user/password`
- **Authentication:** Required (Bearer Token)
- **Request Body:**
  ```json
  {
    "currentPassword": "oldPassword123!",
    "newPassword": "newPassword456!"
  }
  ```
- **Response:**
  - `200 OK`: 변경 성공
  - `401 Unauthorized`: 현재 비밀번호 불일치

### 5.3 북마크한 합주실 목록 조회
- **Endpoint:** `GET /user/bookmarks`
- **Authentication:** Required (Bearer Token)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-studio-1",
        "name": "낙원 합주실",
        "mapUrl": "https://naver.me/...",
        "description": "최고의 시설...",
        "images": ["url1.jpg", "url2.jpg"],
        "lat": 37.1234,
        "lng": 127.1234,
        "status": "active"
      }
    ]
  }
  ```

### 5.4 내가 제보한 합주실 내역 조회
- **Endpoint:** `GET /user/submissions`
- **Authentication:** Required (Bearer Token)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-studio-2",
        "name": "홍대 연습실",
        "mapUrl": "https://naver.me/...",
        "description": "유저 제보 데이터입니다.",
        "images": ["submission_img1.jpg"],
        "lat": 37.5678,
        "lng": 126.9876,
        "status": "pending"
      }
    ]
  }
  ```

---

## 6. 어드민 API (Admin)

모든 어드민 API는 `role === 'admin'`인 사용자만 접근할 수 있습니다. (Bearer Token 및 미들웨어 검증)

### 6.1 관리자 통계 조회 (현재 유저 수)
- **Endpoint:** `GET /admin/stats`
- **Authentication:** Required (Admin)
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "totalUsers": 150
    }
  }
  ```

### 6.2 수락 대기 중인 합주실 목록 조회
- **Endpoint:** `GET /admin/studios/pending`
- **Authentication:** Required (Admin)
- **Response:**
  ```json
  {
    "success": true,
    "data": [
      {
        "id": "uuid-studio-3",
        "name": "신규 제보 합주실",
        "mapUrl": "https://naver.me/...",
        "description": "새롭게 등록된 곳입니다.",
        "images": ["pending_img1.jpg"],
        "lat": 37.1111,
        "lng": 127.1111,
        "status": "pending",
        "createdBy": "uuid-user-2"
      }
    ]
  }
  ```

### 6.3 합주실 제보 상태 변경 (수락/거절)
- **Endpoint:** `PATCH /admin/studios/:id/status`
- **Authentication:** Required (Admin)
- **Request Body:**
  ```json
  {
    "status": "active" // "active" (수락) 또는 "deny" (거절)
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "id": "uuid-studio-3",
      "status": "active"
    }
  }
  ```
