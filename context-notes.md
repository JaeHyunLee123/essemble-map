# 지도 뷰포트 복구 기능 관련 결정 사항 및 컨텍스트 노트

## 결정 사항

- **동작 방식**: 
  - Next.js 서버 사이드 렌더링(SSR)과의 충돌 및 Hydration Mismatch 에러를 방지하기 위해, `useEffect` 시점에 `localStorage`를 직접 조회하여 지도 시작 좌표 및 줌 레벨을 설정하는 1안 방안을 채택했습니다.
- **저장 포맷**:
  - `assemble-room-map-viewport` 키를 사용하여 `{ lat: number, lng: number, zoom: number }` 형태로 JSON 변환하여 통합 관리합니다.
- **저장 시점**:
  - 드래그 및 줌 변경 시 이미 적용된 300ms 디바운스 타이머가 끝난 시점(`updateBounds` 내부)에 저장소를 업데이트하여 중복 요청을 방지합니다.
