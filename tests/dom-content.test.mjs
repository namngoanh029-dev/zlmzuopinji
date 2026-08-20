import test from "node:test";
import assert from "node:assert/strict";
import { CASE_ITEMS, EXPERIENCE_TIMELINE, PORTFOLIO_ITEMS } from "../js/content.js";

class FakeStyle {
  setProperty(name, value) {
    this[name] = String(value);
  }
}

class FakeElement extends EventTarget {
  constructor(tagName) {
    super();
    this.tagName = tagName;
    this.attributes = new Map();
    this.children = [];
    this.className = "";
    this.classList = { add: (...names) => { this.className = `${this.className} ${names.join(" ")}`.trim(); } };
    this.dataset = {};
    this.style = new FakeStyle();
    this.textContent = "";
  }

  setAttribute(name, value) {
    this.attributes.set(name, String(value));
  }

  getAttribute(name) {
    return this.attributes.get(name) ?? null;
  }

  append(...children) {
    this.children.push(...children);
  }

  replaceChildren(...children) {
    this.children = [...children];
  }
}

globalThis.document = {
  createElement: (tagName) => new FakeElement(tagName),
  createElementNS: (_namespace, tagName) => new FakeElement(tagName),
};

const { renderPanel, renderExperienceTimeline, renderSelectedCases, renderStories, renderWorkingMethod } = await import(
  "../js/dom.js"
);

const allText = (node) => [node.textContent, ...node.children.map(allText)].join(" ");
const descendants = (node, predicate) => [
  ...(predicate(node) ? [node] : []),
  ...node.children.flatMap((child) => descendants(child, predicate)),
];
const byClass = (node, className) => descendants(node, (entry) => entry.className === className);

test("experience timeline renders two internships and nests the Paipai project", () => {
  const container = new FakeElement("section");
  renderExperienceTimeline(container, EXPERIENCE_TIMELINE);

  const entries = byClass(container, "experience-entry");
  assert.equal(entries.length, 2);
  assert.match(allText(container), /两段经历，一条方法线/);
  assert.match(allText(entries[0]), /百度智能云/);
  assert.match(allText(entries[0]), /2026.06–至今/);
  assert.match(allText(entries[1]), /爱回收·万物新生/);
  assert.match(allText(entries[1]), /2026.01–2026.05/);
  assert.match(allText(entries[1]), /AI 商品稽查项目/);
  assert.equal(byClass(entries[1], "experience-project").length, 1);
  assert.match(allText(entries[1]), /京东拍拍二手/);
  const project = byClass(entries[1], "experience-project")[0];
  assert.equal(byClass(project, "project-kicker").length, 0);
  assert.equal(byClass(project, "project-index")[0].textContent, "03");
  assert.doesNotMatch(allText(project), /业务协同项目/);
});

test("selected cases preserve research, audit, and Paipai order with a click callback", () => {
  const container = new FakeElement("section");
  const selected = [];
  renderSelectedCases(container, CASE_ITEMS, { select: (id) => selected.push(id) });

  const cards = byClass(container, "case-card");
  assert.match(allText(container), /三张卡片，三种落地方式/);
  assert.deepEqual(cards.map((card) => card.dataset.caseId), [
    "baidu-industry-solutions",
    "ai-audit",
    "refund-automation",
  ]);
  const triggers = byClass(container, "case-card-trigger");
  assert.equal(triggers.length, 3);
  assert.equal(triggers[1].getAttribute("aria-label"), "打开AI 商品稽查项目详情");
  triggers[2].dispatchEvent(new Event("click"));
  assert.deepEqual(selected, ["refund-automation"]);
  assert.match(allText(cards[2]), /京东拍拍二手业务协同项目/);
  assert.match(allText(cards[2]), /90%/);
});

test("working method renders four numbered steps tied to portfolio examples", () => {
  const container = new FakeElement("section");
  const method = PORTFOLIO_ITEMS.find((item) => item.id === "working-method");
  renderWorkingMethod(container, method);

  const steps = byClass(container, "method-step");
  assert.equal(steps.length, 4);
  assert.match(allText(container), /把复杂问题拆成可交付的四步/);
  assert.match(allText(steps[0]), /问题定义/);
  assert.match(allText(steps[1]), /节点拆解/);
  assert.match(allText(steps[2]), /工具匹配/);
  assert.match(allText(steps[3]), /结果复盘/);
});

test("case stories use each case's own editorial kicker", () => {
  const container = new FakeElement("section");
  renderStories(container, CASE_ITEMS);
  const kickers = byClass(container, "story-kicker").map((entry) => entry.textContent);
  assert.deepEqual(kickers, ["RESEARCH", "MULTIMODAL", "BUSINESS PROJECT"]);
  assert.match(allText(container), /京东拍拍二手业务协同项目/);
});

test("renderPanel renders the 3D printing solution snapshot", () => {
  const container = new FakeElement("aside");
  renderPanel(container, PORTFOLIO_ITEMS.find((item) => item.id === "baidu-industry-solutions"));
  assert.match(allText(container), /3D PRINTING \/ SOLUTION SNAPSHOT/);
  assert.match(allText(container), /设备与材料厂商/);
  assert.match(allText(container), /切片与路径优化/);
});

test("renderPanel renders the sports and health solution snapshot", () => {
  const container = new FakeElement("aside");
  renderPanel(container, PORTFOLIO_ITEMS.find((item) => item.id === "baidu-industry-solutions"));
  assert.match(allText(container), /SPORTS & HEALTH \/ SOLUTION SNAPSHOT/);
  assert.match(allText(container), /智能硬件与穿戴设备/);
  assert.match(allText(container), /AIGC/);
  assert.match(allText(container), /运动健康行业产品解决方案/);
});

test("renderPanel renders the latest AI 商品稽查 evidence and refund metrics", () => {
  const auditContainer = new FakeElement("aside");
  const refundContainer = new FakeElement("aside");
  renderPanel(auditContainer, PORTFOLIO_ITEMS.find((item) => item.id === "ai-audit"));
  renderPanel(refundContainer, PORTFOLIO_ITEMS.find((item) => item.id === "refund-automation"));
  assert.match(allText(auditContainer), /AI 商品稽查项目/);
  assert.match(allText(auditContainer), /20 万张/);
  assert.match(allText(refundContainer), /90%/);
  assert.doesNotMatch(allText(refundContainer), /70%/);
});
