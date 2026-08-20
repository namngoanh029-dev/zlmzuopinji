import test from "node:test";
import assert from "node:assert/strict";
import {
  CASE_ITEMS,
  CAPABILITY_ITEMS,
  EXPERIENCE_TIMELINE,
  PROFILE,
  PORTFOLIO_ITEMS,
} from "../js/content.js";

test("profile preserves the recruiting identity", () => {
  assert.equal(PROFILE.name, "郑林茂");
  assert.equal(PROFILE.role, "AI 产品经理");
  assert.equal(PROFILE.education, "汕头大学金融学硕士在读");
  assert.equal(PROFILE.company, "爱回收·万物新生集团 / AI 产品实习生");
  assert.equal(PROFILE.email, "1012782105@qq.com");
});

test("internship timeline matches the latest resume dates and roles", () => {
  assert.deepEqual(EXPERIENCE_TIMELINE.map(({ period, employer, role }) => ({ period, employer, role })), [
    { period: "2026.06–至今", employer: "百度智能云", role: "AI 解决方案实习生" },
    { period: "2026.01–2026.05", employer: "爱回收·万物新生集团", role: "AI 商品稽查项目" },
  ]);
});

test("the ability map has exactly two moving avatar regions", () => {
  assert.deepEqual(CAPABILITY_ITEMS.map((item) => item.id), [
    "baidu-industry-solutions",
    "recommerce-ai-solutions",
  ]);
  assert.deepEqual(CAPABILITY_ITEMS.map((item) => item.region), ["face", "body"]);
  assert.ok(PORTFOLIO_ITEMS.some((item) => item.id === "baidu-industry-solutions"));
});

test("internship feature anchors stay within the avatar silhouette", () => {
  for (const item of CAPABILITY_ITEMS) {
    assert.ok(Math.abs(item.anchor[0]) <= 0.42, `${item.id} x anchor is outside the silhouette`);
    assert.ok(item.anchor[1] >= 0 && item.anchor[1] <= 1.35, `${item.id} y anchor is outside the interaction band`);
    assert.ok(item.anchor[2] >= 0.55, `${item.id} feature needs a model-facing depth offset`);
  }
});

test("internship entries map to the avatar face and body regions", () => {
  assert.deepEqual(CAPABILITY_ITEMS.map((item) => item.region), ["face", "body"]);
  assert.ok(CAPABILITY_ITEMS.every((item) => item.anchor[2] >= 0.55));
});

test("industry research carries the 3D printing solution snapshot", () => {
  const research = CAPABILITY_ITEMS.find((item) => item.id === "baidu-industry-solutions");
  assert.deepEqual(research.solutionCard, {
    kicker: "3D PRINTING / SOLUTION SNAPSHOT",
    audience: "设备与材料厂商、打印农场 / 工作室",
    problem: "算法、材料研发与排产工具彼此割裂，客户需要先验证价值，再决定部署深度。",
    approach: "用行业需求拆解切片与路径优化、端侧质检和轻量排产，形成可试用、可落地的 AI 方案路径。",
  });
});

test("industry research includes the AI coding control center evidence", () => {
  const research = PORTFOLIO_ITEMS.find((item) => item.id === "baidu-industry-solutions");
  assert.ok(research.evidence.includes("ai-coding-control-center.png"));
});

test("industry research includes the sports and health solution snapshot", () => {
  const research = PORTFOLIO_ITEMS.find((item) => item.id === "baidu-industry-solutions");
  assert.equal(research.solutionCards.length, 1);
  assert.equal(research.solutionCards[0].kicker, "SPORTS & HEALTH / SOLUTION SNAPSHOT");
  assert.match(research.solutionCards[0].audience, /智能硬件与穿戴设备/);
  assert.match(research.solutionCards[0].approach, /AIGC/);
  assert.ok(research.evidence.includes("sports-health-solution.png"));
});

test("research copy reflects the latest new-retail scope and efficiency result", () => {
  const research = PORTFOLIO_ITEMS.find((item) => item.id === "baidu-industry-solutions");
  assert.match(research.summary, /养老、宠物、AI 产品、智能穿戴、康复医疗/);
  assert.match(research.summary, /效率提升 20%/);
  assert.deepEqual(research.metrics.map((metric) => metric.value), ["15 份", "5 份", "20%"]);
});

test("case stories render in research, audit, Paipai project order", () => {
  assert.deepEqual(CASE_ITEMS.map((item) => item.id), [
    "baidu-industry-solutions",
    "ai-audit",
    "refund-automation",
  ]);
});

test("Paipai keeps a project context without exposing the internship employer in the case panel", () => {
  const refund = CASE_ITEMS.find((item) => item.id === "refund-automation");
  assert.equal(refund.label, "一键转卖自动化退费助手");
  assert.equal(refund.companyContext, "业务自动化项目");
  assert.doesNotMatch(refund.companyContext, /爱回收|万物新生集团/);
  assert.equal(refund.projectContext, "京东拍拍二手业务协同项目");
  assert.equal(refund.metrics.find((metric) => metric.label === "全自动处理率").value, "90%");
});

test("AI 商品稽查 carries the resume's owner scope and delivery metrics", () => {
  const audit = CASE_ITEMS.find((item) => item.id === "ai-audit");
  assert.equal(audit.label, "AI 商品稽查项目");
  assert.match(audit.summary, /20 万张手机商品图/);
  assert.match(audit.summary, /项目 owner/);
  assert.deepEqual(audit.metrics.map((metric) => metric.value), ["20 万张", "90%", "100%", "约 3000 元", "1:40"]);
});

test("refund automation uses the latest resume metrics and impact", () => {
  const refund = CASE_ITEMS.find((item) => item.id === "refund-automation");
  assert.match(refund.summary, /90%.*自动处理/);
  assert.match(refund.summary, /60 小时/);
  assert.match(refund.summary, /4300 元/);
  assert.deepEqual(refund.metrics.map((metric) => metric.value), ["3 分钟→2 秒", "90%", "90%", "100%", "60 小时", "4300 元"]);
  assert.ok(refund.metrics.every((metric) => metric.value !== "70%"));
});

test("the timeline has two formal internships and one nested project", () => {
  assert.deepEqual(EXPERIENCE_TIMELINE.map((entry) => entry.id), ["baidu", "recommerce"]);
  assert.equal(EXPERIENCE_TIMELINE[1].project.company, "京东拍拍二手");
  assert.equal("type" in EXPERIENCE_TIMELINE[1].project, false);
});

test("the audit metrics describe observed results rather than an unverified target", () => {
  const item = PORTFOLIO_ITEMS.find((entry) => entry.id === "ai-audit");
  const recall = item.metrics.find((metric) => metric.label === "LLM 识别准确率");
  assert.equal(recall.value, "90%");
  assert.equal(recall.kind, "result");
});

test("evidence stays with the case it documents", () => {
  const refund = PORTFOLIO_ITEMS.find((entry) => entry.id === "refund-automation");
  const audit = PORTFOLIO_ITEMS.find((entry) => entry.id === "ai-audit");
  assert.ok(refund.evidence.includes("teaching-case-01.png"));
  assert.ok(refund.evidence.includes("teaching-case-02.jpg"));
  assert.deepEqual(audit.evidence, ["ai-audit-workflow.png"]);
});

test("refund automation states its manual exception boundary", () => {
  const refund = PORTFOLIO_ITEMS.find((entry) => entry.id === "refund-automation");
  assert.match(`${refund.summary} ${refund.steps.join(" ")}`, /转人工|人工兜底/);
});

test("working method reconnects each step to a concrete portfolio example", () => {
  const method = PORTFOLIO_ITEMS.find((entry) => entry.id === "working-method");
  assert.match(method.steps[0], /问题定义.*行业研究/);
  assert.match(method.steps[1], /节点拆解.*热点雷达/);
  assert.match(method.steps[2], /工具匹配.*退费/);
  assert.match(method.steps[3], /结果复盘.*AI 商品稽查/);
});

test("each item has readable evidence and a model anchor", () => {
  for (const item of PORTFOLIO_ITEMS) {
    assert.ok(item.summary.length > 20);
    assert.ok(item.steps.length >= 4);
    assert.ok(Array.isArray(item.anchor));
    assert.equal(item.anchor.length, 3);
    assert.ok(item.anchor.every(Number.isFinite));
  }
});

test("capability anchors stay on the fallback avatar silhouette", () => {
  for (const item of PORTFOLIO_ITEMS) {
    const [x, y, z] = item.anchor;
    assert.ok(Math.abs(x) <= 1.05, `${item.id} extends beyond the avatar width`);
    assert.ok(y >= -1.6 && y <= 1.9, `${item.id} extends beyond the avatar height`);
    assert.ok(z >= 0.2 && z <= 0.8, `${item.id} is not on the camera-facing surface`);
  }
});

test("the content contract is deeply frozen", () => {
  assert.ok(Object.isFrozen(PROFILE));
  assert.ok(Object.isFrozen(PORTFOLIO_ITEMS));

  for (const item of PORTFOLIO_ITEMS) {
    assert.ok(Object.isFrozen(item));
    assert.ok(Object.isFrozen(item.steps));
    assert.ok(Object.isFrozen(item.metrics));
    assert.ok(item.metrics.every((metric) => Object.isFrozen(metric)));
    assert.ok(Object.isFrozen(item.evidence));
    assert.ok(Object.isFrozen(item.anchor));
  }
});
