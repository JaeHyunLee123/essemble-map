# 합주실 정보를 모아둔 지도 앱

## 기술스택
 - Core: NextJS, Typescript
 - ORM: Drizzle
 - Styling: TailwindCSS, lucide icon
 - Map: 네이버 지도 api (https://navermaps.github.io/maps.js.ncp/docs/tutorial-1-Conceptual-Overview.html)
 - Deploy: Vercel(web), Supabase(db, image)
 - Test: Vitest, Playwright
 - Log 분석: Posthog 
 - etc: axios, tanstackquery, react hook form


 ## 기능

 ### 합주실 정보
 - 홈 화면에 접속하면 지도를 보여주고 지도 위에 마커 및 합주실 이름 보여주기
 - 합주실 마커를 선택하면 모달로 합주실 정보 보여주기
 - 보여줘야하는 정보
  - 합주실 이름
  - 합주실 네이버 지도 링크
  - 설명
  - 사진
  - 방 정보 (리스트)
    - 사진
    - 시간 당 가격
    - 최소 인원
    - 최대 인원
    - 설명
    - 장비 (리스트)
      - 장비 유형 (키보드, 드럼, 기타 앰프, 베이스 앰프 등)
      - 장비 이름

 
 ### 로그인 & 회원가입
 - access token(json으로 전달하고 클라이언트에서 로컬스토리지에 저장)과 refresh token(http only cookie)으로 구성
 - 회원가입 시 아이디(중복 X), 비밀번호, 비밀번호 확인, 닉네임(중복 X)으로 회원가입
 - 로그인 시 아이디, 비밀번호로 구성

 
### 합주실 북마크
- 로그인 한 유저만 가능

### 합주실 제보
- 로그인 한 유저만 가능
- 제출 후 일단 pending 상태 (추후 어드민 페이지에서 accept or deny)

### 마이페이지
- 닉네임 변경
- 비밀번호 변경
- 북마크한 합주실
- 제보한 합주실


