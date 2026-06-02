<!-- 합주실 정보 수정 요청 및 승인 프로세스 구현 체크리스트 -->
# 합주실 정보 수정 요청 및 승인 프로세스 구현 체크리스트

## 1. 데이터베이스 스키마 및 마이그레이션
- [ ] `src/db/schema.ts`에 `studio_update_request_status` enum 추가
- [ ] `src/db/schema.ts`에 `studio_update_requests` 테이블 및 relations 정의 추가
- [ ] 데이터베이스 마이그레이션 생성 및 반영 검증

## 2. 백엔드 API 개발 및 TDD 단위 테스트
- [ ] `POST /api/studios/:id/update-request` (수정 요청 제출) 단위 테스트 작성 및 API 구현
- [ ] `GET /api/admin/studio-requests/pending` (어드민 대기열 조회) 단위 테스트 작성 및 API 구현
- [ ] `PATCH /api/admin/studio-requests/:id/status` (어드민 수정 요청 승인/반려) 단위 테스트 작성 및 API 구현
- [ ] 어드민 제보 승인 API `PATCH /api/admin/studios/:id/status`에서 수정 내용 반영이 가능하도록 기능 추가 및 테스트 보완
- [ ] `GET /api/user/submissions` (마이페이지 제보 내역)에 수정 요청 내역(`studio_update_request`) 병합 조회 로직 연동 및 테스트 보완

## 3. 프론트엔드 UI/UX 컴포넌트 개발
- [ ] 합주실 상세 모달 하단에 [정보 수정 제안] 버튼 추가 (로그인 상태 권한 처리)
- [ ] 수정 제안 폼 모달 개발 (원본 데이터 자동 로드 및 필드 값 변경 검증)
- [ ] 어드민 페이지 대시보드 내 "수정 요청 대기열" 탭 및 리스트 렌더링 추가
- [ ] 어드민용 수정 요청 검토 모달 개발 (원본 정보, 제안 정보, 어드민 편집 폼 3분할 뷰 및 액션 처리)
- [ ] 마이페이지 제보 내역 탭에 `studio_update_request` 타입 카드 및 승인/반려 상태 UI 렌더링 적용

## 4. 최종 검증 및 빌드
- [ ] 백엔드 및 프론트엔드 전체 단위 테스트 실행 (`npm run test` 등)
- [ ] Next.js 전체 프로젝트 빌드 실행 (`npm run build`) 및 오류 없음 확인
- [ ] 최종 수동 시나리오 검증
