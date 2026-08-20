const toText = (value) => String(value ?? "");

const EVIDENCE_ALT = Object.freeze({
  "refund-result-01.jpg": "退费自动化订单与物流信息查询结果",
  "refund-result-02.jpg": "退费自动化单笔处理耗时结果",
  "refund-result-03.jpg": "退费自动化完整工作流编排图",
  "refund-result-04.jpg": "退费自动化执行后的后台流水记录",
  "ai-audit-workflow.png": "AI 商品稽查工作流节点与判断链路",
  "teaching-case-01.png": "退费自动化案例教学分享聊天记录",
  "teaching-case-02.jpg": "退费自动化案例教学课件全景",
  "ai-coding-control-center.png": "AI Coding Skill 使用与工作流编排控制中台界面",
  "sports-health-solution.png": "运动健康行业产品解决方案思路图",
});

const WIDE_EVIDENCE_FILES = new Set(["ai-coding-control-center.png", "sports-health-solution.png"]);

const CHAPTER_LABELS = Object.freeze(["问题", "判断", "方案", "结果"]);

function appendTextElement(parent, tagName, className, value) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = toText(value);
  parent.append(element);
  return element;
}

export function renderPanel(container, item, locked = false, handlers = {}) {
  if (!container || !item) return;
  const safeHandlers = handlers ?? {};
  container.dataset.locked = String(locked);
  container.replaceChildren();

  if (locked) {
    const closeButton = document.createElement("button");
    closeButton.type = "button";
    closeButton.className = "panel-close";
    closeButton.setAttribute("aria-label", "收起详情");
    closeButton.textContent = "\u00d7";
    closeButton.addEventListener("click", () => safeHandlers.dismiss?.(item.id));
    container.append(closeButton);
  }

  appendTextElement(container, "p", "panel-eyebrow", `${toText(item.kind).toUpperCase()} / ${locked ? "LOCKED" : "EXPLORE"}`);
  appendTextElement(container, "h2", "", item.label);
  appendTextElement(container, "p", "panel-summary", item.summary);

  const solutionCards = [
    ...(item.solutionCard ? [item.solutionCard] : []),
    ...(item.solutionCards ?? []),
  ];
  for (const [solutionIndex, solution] of solutionCards.entries()) {
    const solutionCard = document.createElement("section");
    solutionCard.className = `solution-card${solutionIndex > 0 ? " solution-card--secondary" : ""}`;
    appendTextElement(solutionCard, "p", "solution-card-kicker", solution.kicker);
    const solutionGrid = document.createElement("div");
    solutionGrid.className = "solution-card-grid";
    for (const [key, label] of [["audience", "客户对象"], ["problem", "核心矛盾"], ["approach", "方案切入"]]) {
      const point = document.createElement("div");
      point.className = "solution-card-point";
      appendTextElement(point, "span", "solution-card-label", label);
      appendTextElement(point, "p", "solution-card-copy", solution[key]);
      solutionGrid.append(point);
    }
    solutionCard.append(solutionGrid);
    container.append(solutionCard);
  }

  const metricsBlock = document.createElement("section");
  metricsBlock.className = "panel-block";
  appendTextElement(metricsBlock, "h3", "", "指标");
  const metrics = document.createElement("div");
  metrics.className = "metrics";
  for (const metric of item.metrics ?? []) {
    const metricElement = document.createElement("div");
    metricElement.className = "metric";
    metricElement.dataset.metricKind = toText(metric.kind || "result");
    metricElement.textContent = `${toText(metric.value)} / ${toText(metric.label)}${metric.kind === "target" ? " / 目标" : ""}`;
    metrics.append(metricElement);
  }
  metricsBlock.append(metrics);
  container.append(metricsBlock);

  const stepsBlock = document.createElement("section");
  stepsBlock.className = "panel-block";
  appendTextElement(stepsBlock, "h3", "", "四步工作流");
  const steps = document.createElement("ol");
  steps.className = "steps";
  for (const step of (item.steps ?? []).slice(0, 4)) appendTextElement(steps, "li", "", step);
  stepsBlock.append(steps);
  container.append(stepsBlock);

  const evidenceBlock = document.createElement("section");
  evidenceBlock.className = "panel-block";
  appendTextElement(evidenceBlock, "h3", "", "证据");
  const gallery = createEvidenceGallery(item.evidence);
  evidenceBlock.append(gallery.element);
  container.append(evidenceBlock);
  if (gallery.lightbox) container.append(gallery.lightbox);
}

function createEvidenceGallery(files = []) {
  const element = document.createElement("div");
  element.className = "evidence-grid";
  if (!files.length) {
    appendTextElement(element, "p", "evidence-empty", "过程记录整理中");
    return { element, lightbox: null };
  }

  const lightbox = createEvidenceLightbox();
  for (const file of files) {
    const safeFile = toText(file);
    const alt = EVIDENCE_ALT[safeFile] ?? `项目证据：${safeFile}`;
    const path = `./assets/evidence/${encodeURIComponent(safeFile)}`;
    const link = document.createElement("a");
    link.className = `evidence-link${WIDE_EVIDENCE_FILES.has(safeFile) ? " evidence-link--wide" : ""}`;
    link.href = path;
    const thumbnail = document.createElement("img");
    thumbnail.src = path;
    thumbnail.alt = alt;
    thumbnail.loading = "lazy";
    thumbnail.decoding = "async";
    link.append(thumbnail);
    appendTextElement(link, "span", "evidence-caption", alt);
    link.addEventListener("click", (event) => {
      event.preventDefault();
      lightbox.open(path, alt);
    });
    element.append(link);
  }
  return { element, lightbox: lightbox.element };
}

function createEvidenceLightbox() {
  const lightbox = document.createElement("dialog");
  lightbox.className = "evidence-lightbox";
  lightbox.setAttribute("aria-label", "证据图片预览");

  const closeButton = document.createElement("button");
  closeButton.type = "button";
  closeButton.className = "lightbox-close";
  closeButton.setAttribute("aria-label", "关闭图片预览");
  closeButton.textContent = "关闭";

  const figure = document.createElement("figure");
  const image = document.createElement("img");
  const caption = document.createElement("figcaption");
  figure.append(image, caption);
  lightbox.append(closeButton, figure);

  const close = () => {
    if (typeof lightbox.close === "function" && lightbox.open) lightbox.close();
    else lightbox.removeAttribute("open");
    lightbox.classList.remove("is-fallback-open");
  };

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    }
  });
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  return {
    element: lightbox,
    open(src, alt) {
      image.src = src;
      image.alt = alt;
      caption.textContent = alt;
      if (typeof lightbox.showModal === "function") lightbox.showModal();
      else {
        lightbox.setAttribute("open", "");
        lightbox.classList.add("is-fallback-open");
      }
      closeButton.focus();
    },
  };
}

export function renderExperienceTimeline(container, entries = []) {
  if (!container) return;
  container.replaceChildren();

  const section = document.createElement("div");
  section.className = "timeline-section";
  appendTextElement(section, "p", "section-kicker", "EXPERIENCE / 02");
  appendTextElement(section, "h2", "", "两段经历，一条方法线");
  appendTextElement(section, "p", "section-intro", "从行业判断到业务落地，项目证据都放在真实的工作语境里。");

  const list = document.createElement("ol");
  list.className = "experience-list";
  for (const entry of entries) {
    const item = document.createElement("li");
    item.className = "experience-entry";
    item.dataset.experienceId = toText(entry.id);

    const marker = document.createElement("div");
    marker.className = "experience-marker";
    appendTextElement(marker, "span", "experience-period", entry.period);
    appendTextElement(marker, "span", "experience-index", String(list.children.length + 1).padStart(2, "0"));

    const body = document.createElement("div");
    body.className = "experience-body";
    appendTextElement(body, "h3", "", entry.employer);
    appendTextElement(body, "p", "experience-role", entry.role);
    appendTextElement(body, "p", "experience-highlights", entry.highlights);

    if (entry.project) {
      const project = document.createElement("article");
      project.className = "experience-project";
      const projectTopline = document.createElement("div");
      projectTopline.className = "project-topline";
      appendTextElement(projectTopline, "span", "project-index", String(list.children.length + 2).padStart(2, "0"));
      appendTextElement(projectTopline, "p", "project-company", entry.project.company);
      project.append(projectTopline);
      appendTextElement(project, "h4", "", entry.project.title);
      appendTextElement(project, "p", "project-result", entry.project.result);
      body.append(project);
    }

    item.append(marker, body);
    list.append(item);
  }
  section.append(list);
  container.append(section);
}

export function renderSelectedCases(container, items = [], handlers = {}) {
  if (!container) return;
  const safeHandlers = handlers ?? {};
  container.replaceChildren();

  const section = document.createElement("div");
  section.className = "selected-cases-section";
  appendTextElement(section, "p", "section-kicker", "SELECTED CASES / 03");
  appendTextElement(section, "h2", "", "三张卡片，三种落地方式");
  appendTextElement(section, "p", "section-intro", "每个项目都保留问题、判断、方案和结果，方便快速判断我如何把 AI 接进业务。");

  const grid = document.createElement("ol");
  grid.className = "case-card-grid";
  for (const [index, item] of items.entries()) {
    const card = document.createElement("li");
    card.className = "case-card";
    card.dataset.caseId = toText(item.id);
    card.dataset.caseOrder = String(index + 1).padStart(2, "0");

    const trigger = document.createElement("button");
    trigger.type = "button";
    trigger.className = "case-card-trigger";
    const projectSuffix = toText(item.label).endsWith("项目") ? "" : "项目";
    trigger.setAttribute("aria-label", `打开${toText(item.label)}${projectSuffix}详情`);
    trigger.addEventListener("click", () => {
      safeHandlers.select?.(item.id);
      if (!safeHandlers.select) safeHandlers.toggleLock?.(item.id);
    });

    const top = document.createElement("div");
    top.className = "case-card-topline";
    appendTextElement(top, "span", "case-card-number", `0${index + 1}`);
    appendTextElement(top, "span", "case-card-kicker", item.storyKicker ?? item.kind);
    trigger.append(top);
    appendTextElement(trigger, "h3", "case-card-title", item.label);
    if (item.projectContext) appendTextElement(trigger, "p", "case-card-context", item.projectContext);
    else if (item.companyContext) appendTextElement(trigger, "p", "case-card-context", item.companyContext);
    appendTextElement(trigger, "p", "case-card-summary", item.summary);

    const result = document.createElement("div");
    result.className = "case-card-result";
    for (const metric of (item.metrics ?? []).slice(0, 2)) {
      appendTextElement(result, "span", "case-card-metric", `${toText(metric.value)} / ${toText(metric.label)}${metric.kind === "target" ? " / 目标" : ""}`);
    }
    trigger.append(result);
    card.append(trigger);
    grid.append(card);
  }
  section.append(grid);
  container.append(section);
}

export function renderWorkingMethod(container, item) {
  if (!container || !item) return;
  container.replaceChildren();

  const section = document.createElement("div");
  section.className = "method-section";
  appendTextElement(section, "p", "section-kicker", "WORKING METHOD / 04");
  appendTextElement(section, "h2", "", "把复杂问题拆成可交付的四步");
  appendTextElement(section, "p", "section-intro", item.summary);

  const list = document.createElement("ol");
  list.className = "method-steps";
  for (const [index, step] of (item.steps ?? []).slice(0, 4).entries()) {
    const entry = document.createElement("li");
    entry.className = "method-step";
    appendTextElement(entry, "span", "method-step-number", `0${index + 1}`);
    const [title, ...copy] = toText(step).split("：");
    appendTextElement(entry, "h3", "", title);
    appendTextElement(entry, "p", "", copy.join("："));
    list.append(entry);
  }
  section.append(list);
  container.append(section);
}

export function renderStories(container, items, handlers = {}) {
  if (!container) return;
  container.replaceChildren();
  for (const [caseIndex, item] of items.filter((entry) => entry.kind === "case").entries()) {
    const story = document.createElement("section");
    story.className = "story story--case";
    story.id = `${toText(item.id)}-story`;
    story.dataset.chapterId = item.id;

    const header = document.createElement("header");
    header.className = "story-header";
    appendTextElement(header, "p", "story-kicker", item.storyKicker ?? `CASE 0${caseIndex + 1}`);
    const title = appendTextElement(header, "h2", "", item.label);
    title.id = `${item.id}-story-title`;
    story.setAttribute("aria-labelledby", title.id);
    if (item.companyContext) appendTextElement(header, "p", "story-context", `${item.companyContext}${item.projectContext ? ` · ${item.projectContext}` : ""}`);
    appendTextElement(header, "p", "story-summary", item.summary);
    const returnLink = document.createElement("a");
    returnLink.className = "return-link";
    returnLink.href = "#top";
    returnLink.textContent = "回到能力地图";
    header.append(returnLink);

    const sequence = document.createElement("ol");
    sequence.className = "chapter-sequence";
    let storyLightbox = null;
    CHAPTER_LABELS.forEach((label, index) => {
      const beat = document.createElement("li");
      beat.className = "chapter-beat";
      beat.dataset.chapterPart = label;
      appendTextElement(beat, "span", "chapter-number", `0${index + 1}`);
      appendTextElement(beat, "h3", "", label);
      appendTextElement(beat, "p", "chapter-copy", item.steps?.[index] ?? "");
      if (label === "结果") {
        const result = appendTextElement(
          beat,
          "p",
          "chapter-result",
          item.metrics
            .map((metric) => `${metric.value} / ${metric.label}${metric.kind === "target" ? " / 目标" : ""}`)
            .join(" · "),
        );
        result.dataset.metricKind = item.metrics.some((metric) => metric.kind === "target") ? "target" : "result";
        const gallery = createEvidenceGallery(item.evidence);
        gallery.element.classList.add("chapter-evidence");
        beat.append(gallery.element);
        storyLightbox = gallery.lightbox;
      }
      sequence.append(beat);
    });

    story.append(header, sequence);
    if (storyLightbox) story.append(storyLightbox);
    container.append(story);
  }
}

export function renderFallbackList(container, items, handlers = {}) {
  if (!container) return;
  const safeHandlers = handlers ?? {};
  container.replaceChildren();
  const section = document.createElement("div");
  section.className = "fallback-list";
  appendTextElement(section, "p", "section-kicker", "TEXT-FIRST FALLBACK");
  appendTextElement(section, "h2", "", "全部能力入口");
  const list = document.createElement("ul");
  for (const item of items) {
    const listItem = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "fallback-entry";
    button.dataset.itemId = item.id;
    button.setAttribute("aria-pressed", "false");
    button.textContent = toText(item.label);
    button.addEventListener("pointerenter", () => safeHandlers.activate?.(item.id));
    button.addEventListener("focus", () => safeHandlers.activate?.(item.id));
    button.addEventListener("click", () => safeHandlers.toggleLock?.(item.id));
    listItem.append(button);
    list.append(listItem);
  }
  section.append(list);
  container.append(section);
}
