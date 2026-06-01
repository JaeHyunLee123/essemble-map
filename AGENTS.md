<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. No Closing Colons (Korean Output)

**End Korean sentences with a period, not a colon.**

When the user writes in Korean, your output is also Korean:
- Don't end sentences with `:` even if the next line is a list or example.
- LLMs trained on English docs leak the colon habit into Korean. Catch it.
- The test: every Korean sentence terminator should be `.`, `?`, or `!` — not `:`.
- Colons are fine inside code, key-value pairs, or labels. Not as sentence enders.

## 6. File Header Comments in Korean

**First line of every new source file: a one-line Korean comment stating its role.**

When creating a new file:
- TypeScript/JavaScript: `// 사용자 인증 상태를 관리하는 Context Provider`
- Python: `# KIS API 호출을 비동기로 래핑하는 클라이언트`
- SQL: `-- 일별 집계 결과를 저장하는 머티리얼라이즈드 뷰`
- Place it directly under required directives (`'use client'`, `'use server'`, shebang).
- Skip config files (`*.config.ts`, `package.json`, etc.).

Why: agents read files selectively, not whole codebases. A one-line Korean header gives instant context so the next session (human or agent) can navigate without re-reading the entire file.

## 7. Plan + Checklist + Context Notes

**Before any non-trivial task, produce three artifacts. Don't start coding without them.**

- **Plan** — what we're building and why.
- **Checklist** (`checklist.md`) — concrete tasks as checkboxes. Tick as you go.
- **Context Notes** (`context-notes.md`) — decisions made during the work and the reasoning behind them. Append continuously.

If the user gives only a plan and asks you to start coding, stop and ask: "Should I create the checklist and context notes first?" The next session — yours or someone else's — needs the notes to pick up where you left off without re-deriving every decision.

## 8. Run Tests Before Marking Complete

**If you touched code, run the tests before saying "done".**

- `npm test`, `pytest`, `cargo test`, whatever the project uses — run it.
- If tests pass, report results. If they fail, fix and re-run.
- No test setup? At minimum, verify the project builds/compiles.
- Run tests proactively, before the user signals "끝", "완료", "다 됐어" — not after.

This is the step LLMs skip most often. Treat it as non-negotiable.

## 9. Semantic Commits

**Commit when one logical change is complete. Don't wait for the user to ask.**

- The test: "Can I describe this commit in one sentence?" If yes, commit. If no, the changes are still mixed — split them.
- Good: "auth 미들웨어 추가". Bad: "auth 추가하고 UI도 고치고 버그도 수정" (split into 3).
- Don't accumulate 20 unrelated edits and lose the ability to roll back individually.
- Don't commit just to commit — meaningful units only.

Note: For solo prototypes or throwaway scripts, group commits loosely if it slows you down. The point is reversibility, not ceremony.

## 10. Read Errors, Don't Guess

**Read the actual error/log line. Don't pattern-match from memory.**

When something fails:
- Read the full error message and stack trace.
- Check the actual log output, not what you assume it should say.
- Don't apply a "common fix" before confirming the cause.
- If unclear, add a print/log to verify state — then fix.

This is the step LLMs skip most often after "run tests". They guess from error keywords and apply the most-recent-pattern fix. That's how a one-line bug becomes a three-file refactor.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.


## 개발 시 참고해야하는 문서들
- 개발 시 항상 @./docs/implementation_plans.md 및 이 문서에 링크된 문서 참고

## 개발 시 사용해야하는 스킬들

[CRITICAL RULE] 에이전트는 사용자의 요청을 처리하기 전에, 아래 명시된 '상황'에 해당하는지 반드시 스스로 평가(Self-evaluate)해야 합니다. 조건에 부합할 경우, 임의로 코드를 작성하기 전에 반드시 해당 스킬을 먼저 호출하여 실행해야 합니다.

1. diagnose
- 트리거 키워드: "버그", "에러", "실패", "성능 저하", "왜 이러지?", "디버깅", "고쳐줘"
상황: 원인을 알 수 없는 복잡한 버그나 성능 저하 현상이 발생했을 때 사용합니다.
활용법: 단순히 코드를 보고 추측하는 것이 아니라, "재현(reproduce) → 최소화(minimise) → 가설 수립(hypothesise) → 계측(instrument) → 수정(fix) → 회귀 테스트(regression-test)"라는 체계적인 디버깅 루프를 강제합니다.
적용 예시: "왜 특정 상황에서만 렌더링이 두 번 일어나지?", "메모리 누수가 발생하는 것 같은데 원인을 찾아줘"와 같은 요청 시.

2. grill-with-docs
- 트리거 키워드: "설계 검토", "허점 찾기", "기획 피드백", "구조 충돌 확인"
상황: 새로운 기능 개발 전, 계획한 설계가 기존 도메인 모델이나 구조와 충돌하지 않는지 검증할 때 사용합니다.
활용법: 개발 계획을 기존 프로젝트의 CONTEXT.md 및 ADR(Architecture Decision Records)과 대조하여 허점을 찌르고(Grilling), 용어를 명확히 다듬으며 관련 문서를 업데이트합니다.
적용 예시: "합주실 제보 기능을 이런 DB 구조로 붙이려고 하는데 내 계획을 검토하고 빈틈을 찾아줘."

3. improve-codebase-architecture
- 트리거 키워드: "리팩토링", "구조 개선", "아키텍처 변경", "코드 복잡도 감소"
상황: 코드베이스가 비대해지거나 결합도가 높아져 구조적인 개선(리팩토링)이 필요할 때 사용합니다.
활용법: 도메인 언어 및 기존 결정(ADR)을 기반으로 코드베이스 내에서 아키텍처를 심화시킬 수 있는 기회를 찾고 리팩토링 방향을 제안합니다.
적용 예시: "현재 컴포넌트 구조가 너무 복잡해졌는데, 도메인 주도 설계 관점에서 아키텍처를 개선해줘."

4. setup-matt-pocock-skills
- 트리거 키워드: "초기 환경 세팅", "기초 설정", "에이전트 준비", "스캐폴딩"
상황: 프로젝트 초기에 다른 에이전트 스킬들이 정상적으로 작동하기 위한 기반 환경(설정)을 구성해야 할 때 사용합니다.
활용법: 이슈 트래커, Triage 라벨 사전, 도메인 문서 레이아웃 등 저장소 단위의 기본 설정 파일들을 스캐폴딩(Scaffold)합니다. (보통 프로젝트당 1회 실행)
적용 예시: "이 리포지토리에 TDD나 이슈 자동화 에이전트 스킬을 적용하기 위해 기초 환경을 세팅해줘."

5. tdd
- 트리거 키워드: "TDD", "테스트 주도 개발", "단위 테스트", "안전하게 구현"
상황: 새로운 기능을 추가하거나 버그를 수정할 때, 테스트 주도 개발(Test-Driven Development) 방식으로 안전하게 구현하고 싶을 때 사용합니다.
활용법: Red(실패하는 테스트 작성) → Green(테스트를 통과하는 최소한의 코드 작성) → Refactor(코드 개선) 루프를 돌며 기능의 수직적 조각(Vertical slice)을 완성합니다.
적용 예시: "로그인 API 로직을 TDD 방식으로 구현해줘."

6. vercel-react-view-transitions
- 트리거 키워드: "애니메이션", "화면 전환", "부드럽게 이동", "공유 요소(Shared Element)"
상황: React 애플리케이션에서 페이지 이동이나 UI 상태 변경 시 부드럽고 네이티브 앱 같은 애니메이션(View Transition)을 추가하고 싶을 때 사용합니다.
활용법: 외부 애니메이션 라이브러리 없이 브라우저 네이티브 API를 활용하여 라우트 변경, 목록 순서 변경, 모달 등장/퇴장 등의 전환 효과를 구현하는 최적의 패턴을 적용합니다.
적용 예시: "리스트에서 합주실 카드를 클릭해 상세 페이지로 넘어갈 때, 이미지가 자연스럽게 확대되는 공유 요소(Shared Element) 전환 효과를 넣어줘."

7. web-design-guidelines
- 트리거 키워드: "디자인 가이드라인", "UI/UX 개선", "예쁘게 디자인", "트렌디한 폼"
상황: UI/UX 디자인을 구현하거나 개선할 때, 일관성 있고 현대적인 웹 디자인 표준을 적용해야 할 때 사용합니다.
활용법: 색상 톤, 여백(Spacing), 타이포그래피, 반응형 레이아웃 등 미적 완성도와 사용성을 높이기 위한 가이드라인을 강제합니다.
적용 예시: "마이페이지 폼 레이아웃을 작성할 건데, 웹 디자인 가이드라인에 맞춰서 깔끔하고 트렌디하게 컴포넌트를 구성해줘."

8. react-best-practices
- 트리거 키워드: "리액트 모범 사례", "성능 최적화", "훅(Hooks) 올바른 사용", "안티 패턴 방지"
상황: React(또는 Next.js) 컴포넌트를 작성하거나 기존 코드를 리뷰/리팩토링할 때 사용합니다.
활용법: 최신 React 패턴, Hooks의 올바른 사용법, 렌더링 성능 최적화, 상태 관리 안티 패턴 방지 등 모범 사례를 적용합니다.
적용 예시: "이 컴포넌트에서 useEffect가 너무 남용된 것 같은데 React 모범 사례에 맞게 리팩토링해줘."

## 11. Component File Naming Convention (PascalCase)

**모든 컴포넌트 파일 이름은 파스칼케이스(PascalCase)로 유지해야 합니다.**

- 단, `src/components/ui/` 폴더 안에 있는 파일은 shadcn에서 제공한 파일 그대로 사용해야 하므로 이름을 변경하지 않고 예외로 둡니다.
- 새로 만드는 컴포넌트 파일이나 기존 컴포넌트 파일을 수정할 때는 반드시 이 파스칼케이스 명명 규칙을 준수해야 합니다.

## Agent skills

### Issue tracker

Issues and PRDs for this repo live as GitHub issues. See `docs/agents/issue-tracker.md`.

### Triage labels

The triage roles map directly to standard labels. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout with a global `CONTEXT.md` at the repo root. See `docs/agents/domain.md`.