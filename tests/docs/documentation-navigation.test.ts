// 핵심 문서의 탐색 경로와 Markdown 손상을 검증하는 회귀 테스트
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");

describe("문서 탐색 구조", () => {
  it("AGENTS.md가 실제로 존재하는 구현 계획 문서를 안내한다", () => {
    const agents = readFileSync(resolve(root, "AGENTS.md"), "utf8");
    const implementationPlanPath = agents.match(
      /개발 시 항상 @\.\/(\S+) 및/,
    )?.[1];

    expect(implementationPlanPath).toBeDefined();
    expect(existsSync(resolve(root, implementationPlanPath!))).toBe(true);
  });

  it("핵심 문서에 복사 과정에서 삽입된 줄 번호가 없다", () => {
    const documentPaths = [
      "CONTEXT.md",
      "docs/implementation_plan/implementation_plans.md",
    ];

    for (const documentPath of documentPaths) {
      const document = readFileSync(resolve(root, documentPath), "utf8");

      expect(document, documentPath).not.toMatch(/^\d+:(?: |$)/m);
    }
  });

  it("구현 계획 문서에 상세 구현 계획 링크 섹션이 한 번만 존재한다", () => {
    const implementationPlans = readFileSync(
      resolve(root, "docs/implementation_plan/implementation_plans.md"),
      "utf8",
    );
    const sectionHeadings = implementationPlans.match(
      /^## 🔗 파트별 상세 구현 계획 문서$/gm,
    );

    expect(sectionHeadings).toHaveLength(1);
  });
});
