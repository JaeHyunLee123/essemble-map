# 문서 탐색 구조 정리

## 문제

- `AGENTS.md`가 존재하지 않는 `docs/implementation_plans.md`를 구현 계획 진입점으로 안내한다.
- `CONTEXT.md`에 복사 과정에서 삽입된 `N:` 줄 번호가 남아 Markdown 표와 제목 구조를 손상시킨다.
- `docs/implementation_plan/implementation_plans.md`에 삽입 줄 번호와 중복된 상세 구현 계획 링크 섹션이 남아 있다.

이 문제는 개발자와 에이전트가 구현 계획과 도메인 규칙을 탐색할 때 잘못된 경로를 따르거나 손상된 문맥을 읽게 만든다.

## 해결 범위

- `AGENTS.md`의 구현 계획 경로를 실제 파일 경로로 수정한다.
- `CONTEXT.md`와 `docs/implementation_plan/implementation_plans.md`에서 잘못 삽입된 줄 번호를 제거한다.
- 구현 계획 문서의 중복 링크 섹션을 제거한다.
- 문서 탐색 경로와 핵심 문서 형식을 검증하는 회귀 테스트를 추가한다.

`docs/adr/` 부재는 `docs/agents/domain.md` 지침에 따라 문제로 취급하지 않으며 빈 폴더를 만들지 않는다.

## 성공 기준

- `AGENTS.md`에 명시된 구현 계획 진입점이 실제 파일을 가리킨다.
- 핵심 문서에 `N:` 형태로 잘못 삽입된 줄 번호가 없다.
- 구현 계획 문서에 상세 구현 계획 링크 섹션이 한 번만 존재한다.
- 문서 회귀 테스트, 전체 테스트, 프로덕션 빌드가 통과한다.
