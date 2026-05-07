<!-- 인증 및 DB 설정 상세 계획 -->
# 인증 및 데이터베이스 (Auth & DB) 구현 계획

이 문서는 Supabase와 Drizzle ORM을 활용한 데이터베이스 구축 및 JWT 기반의 커스텀 인증 로직 구현을 다룹니다.

## 1. Drizzle ORM 스키마 정의
*   `Users` 테이블: 아이디, 비밀번호(bcrypt 해싱), 닉네임, 권한을 포함합니다.
*   기타 도메인 테이블(`Studios`, `Rooms`, `EquipmentCategories` 등)을 선언합니다.
*   관계(Relations)를 설정하여 Join 시 성능을 최적화합니다.

## 2. Supabase Storage 구성
*   `studios`, `rooms`, `equipments` 전용 버킷을 각각 생성하거나 폴더 구조로 관리합니다.
*   버킷의 보안 규칙(RLS)을 퍼블릭 읽기로 설정하고, 쓰기는 서버(Service Role Key)를 통해서만 가능하게 제한합니다.

## 3. 회원가입 및 로그인 (API Routes)
*   **회원가입 (`/api/auth/register`):**
    *   아이디 및 닉네임 중복을 검사합니다.
    *   비밀번호를 해싱하여 DB에 저장합니다.
*   **로그인 (`/api/auth/login`):**
    *   DB 조회 후 비밀번호 일치를 확인합니다.
    *   `Access Token`을 생성하여 응답 본문(JSON)으로 반환합니다.
    *   `Refresh Token`을 생성하여 브라우저 접근이 불가능한 `HttpOnly` 및 `Secure` 속성의 쿠키로 설정합니다.

## 4. 프론트엔드 상태 관리
*   Zustand를 사용하여 `useAuthStore`를 구현합니다.
*   페이지 새로고침 시 로컬스토리지의 Access Token을 복구하거나, 쿠키의 Refresh Token을 통해 백그라운드에서 토큰을 재발급(Silent Refresh) 받습니다.
