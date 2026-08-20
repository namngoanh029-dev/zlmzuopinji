import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
const css = await readFile(new URL("../styles/portfolio.css", import.meta.url), "utf8");
const dom = await readFile(new URL("../js/dom.js", import.meta.url), "utf8");
const contentJs = await readFile(new URL("../js/content.js", import.meta.url), "utf8");
const hotspotView = await readFile(new URL("../js/hotspot-view.js", import.meta.url), "utf8");
const main = await readFile(new URL("../js/main.js", import.meta.url), "utf8");
const scene = await readFile(new URL("../js/scene.js", import.meta.url), "utf8");
const evidenceManifest = JSON.parse(
  await readFile(new URL("../assets/evidence/manifest.json", import.meta.url), "utf8"),
);

test("page exposes semantic identity and fallback content", () => {
  assert.match(html, /<main[^>]+id="portfolio-main"/);
  assert.match(html, /id="avatar-canvas"/);
  assert.match(html, /id="hotspot-layer"/);
  assert.match(html, /id="case-panel"/);
  assert.match(html, /id="fallback-project-list"/);
  assert.match(html, /id="experience-timeline"/);
  assert.match(html, /id="selected-cases"/);
  assert.match(html, /id="working-method"/);
  assert.match(css, /prefers-reduced-motion/);
});

test("page loads local modules and a pinned Three.js import map", () => {
  assert.match(html, /three@0\.169\.0/);
  assert.match(html, /js\/main\.js/);
  assert.match(html, /styles\/portfolio\.css/);
});

test("avatar anchors use the avatar world transform and publish every frame", () => {
  assert.match(scene, /export function projectAvatarAnchors/);
  assert.match(scene, /avatar\.updateMatrixWorld\(true\)/);
  assert.match(scene, /\.applyMatrix4\(avatar\.matrixWorld\)\.project\(camera\)/);
  assert.match(scene, /onAnchors\?\.\(projectAvatarAnchors\(anchors, avatar, camera, wrapper\)\)/);
  const projection = scene.slice(
    scene.indexOf("export function projectAvatarAnchors"),
    scene.indexOf("export function createAvatarScene"),
  );
  assert.doesNotMatch(projection, /querySelector|style\./);
});

test("DOM content renders before the optional scene import", () => {
  assert.match(main, /from "\.\/hotspot-view\.js"/);
  assert.match(main, /renderHotspots/);
  assert.match(main, /renderStories/);
  assert.match(main, /renderFallbackList/);
  assert.match(main, /renderExperienceTimeline/);
  assert.match(main, /renderSelectedCases/);
  assert.match(main, /renderWorkingMethod/);
  assert.match(main, /render\(\)[\s\S]+import\("\.\/scene\.js\?v=20260819-moving-regions-2"\)/);
  assert.match(main, /CAPABILITY_ITEMS/);
  assert.match(main, /CASE_ITEMS/);
  assert.match(main, /EXPERIENCE_TIMELINE/);
  assert.match(main, /for \(const \[id, target\] of hotspotView\.targets\)/);
  assert.doesNotMatch(main, /querySelectorAll\("\.skill-sticker"\)/);
  assert.doesNotMatch(main, /querySelectorAll\("\[data-item-id\]"\)/);
});

test("main coordinates preview, touch exploration, dismissal, and frame positions", () => {
  assert.match(main, /type:\s*"PREVIEW"/);
  assert.match(main, /type:\s*"CLEAR_PREVIEW"/);
  assert.match(main, /type:\s*"SET_EXPLORE"/);
  assert.match(main, /type:\s*"DISMISS_TRACE"/);
  assert.match(main, /event\.key === "Escape"/);
  assert.match(main, /onAnchors:\s*\(positions\)/);
  assert.match(main, /positionHotspotTargets/);
  assert.match(main, /renderCapabilityTrace/);
  assert.match(main, /const traceId = visibleTraceId\(state\)/);
  assert.match(main, /focusAnchor\?\.\(traceId\)/);
});

test("new scene interaction resources are disposed", () => {
  assert.match(main, /clearTimeout\(clearTimer\)/);
  assert.match(main, /clearTimeout\(discoveryTimer\)/);
  assert.match(main, /discoveryObserver\?\.disconnect/);
  assert.match(main, /removeEventListener\??\.?\("keydown", handleKeydown\)/);
  assert.match(main, /removeEventListener\??\.?\("pointerdown", handleScenePointerDown\)/);
  assert.match(main, /hotspotView\.dispose\?\.\(\)/);
  assert.match(main, /const handlePageHide[\s\S]+event\.persisted[\s\S]+dispose\(\)/);
  assert.match(main, /removeEventListener\??\.?\("pagehide", handlePageHide\)/);
});

test("fallback entries share the hotspot interaction handlers", () => {
  const fallbackRenderer = dom.slice(dom.indexOf("export function renderFallbackList"));
  assert.match(fallbackRenderer, /pointerenter[\s\S]+safeHandlers\.activate/);
  assert.match(fallbackRenderer, /focus[\s\S]+safeHandlers\.activate/);
  assert.match(fallbackRenderer, /click[\s\S]+safeHandlers\.toggleLock/);
});

test("evidence thumbnails have a keyboard-closable lightbox", () => {
  assert.match(dom, /document\.createElement\("dialog"\)/);
  assert.match(dom, /showModal/);
  assert.match(dom, /event\.key === "Escape"/);
  assert.match(dom, /event\.target === lightbox/);
  assert.match(dom, /figcaption/);
  assert.match(css, /\.evidence-grid/);
  assert.match(css, /\.evidence-lightbox/);
  assert.match(css, /\.evidence-lightbox\.is-fallback-open\s*{[\s\S]*position:\s*fixed/);
  assert.match(css, /\.evidence-lightbox\.is-fallback-open\s*{[\s\S]*inset:\s*0/);
});

test("all evidence assets have meaningful Chinese alt text", () => {
  assert.equal(evidenceManifest.length, 9);
  for (const entry of evidenceManifest) {
    assert.match(entry.description, /[\u4e00-\u9fff]/);
    assert.ok(entry.description.length >= 10, `${entry.file} needs a description`);
    assert.match(dom, new RegExp(entry.file.replaceAll(".", "\\.")));
    assert.match(dom, new RegExp(entry.description));
  }
});

test("case stories render the approved scroll narrative", () => {
  const stories = dom.slice(
    dom.indexOf("export function renderStories"),
    dom.indexOf("export function renderFallbackList"),
  );
  assert.match(stories, /filter\(\(entry\) => entry\.kind === "case"\)/);
  assert.match(stories, /dataset\.chapterId/);
  assert.match(dom, /\["问题", "判断", "方案", "结果"\]/);
  assert.match(stories, /item\.storyKicker/);
  assert.match(stories, /回到能力地图/);
});

test("the page keeps experiences, selected cases, and working method as separate surfaces", () => {
  assert.match(html, /<section id="experience-timeline"[^>]*><\/section>/);
  assert.match(html, /<section id="selected-cases"[^>]*><\/section>/);
  assert.match(html, /<section id="working-method"[^>]*><\/section>/);
  assert.match(css, /#experience-timeline/);
  assert.match(css, /#selected-cases/);
  assert.match(css, /#working-method/);
});

test("case chapters update state through an intersection observer", () => {
  assert.match(main, /new IntersectionObserver/);
  assert.match(main, /rootMargin:\s*"-35% 0px -50% 0px"/);
  assert.match(main, /type:\s*"SET_CHAPTER"/);
  assert.match(main, /querySelectorAll\("\[data-chapter-id\]"\)/);
  assert.doesNotMatch(main, /addEventListener\("scroll"/);
});

test("case selection respects reduced motion while returning to the story", () => {
  assert.match(main, /prefers-reduced-motion:\s*reduce/);
  assert.match(main, /scrollIntoView/);
  assert.match(main, /behavior:\s*reduceMotion\(\)\s*\?\s*"auto"\s*:\s*"smooth"/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
});

test("mobile keeps the ability list and panel in the hero workflow", () => {
  const hero = html.slice(html.indexOf("<header class=\"hero\""), html.indexOf("</header>") + 9);
  assert.match(hero, /id="fallback-project-list"[\s\S]+id="case-panel"/);
  assert.match(css, /@media \(max-width:\s*720px\)/);
  assert.match(css, /#fallback-project-list[\s\S]+display:\s*grid/);
  assert.match(dom, /container\.dataset\.locked\s*=\s*String\(locked\)/);
  assert.match(css, /\.case-panel\[data-locked="false"\][\s\S]+display:\s*none/);
  assert.match(css, /\.case-panel\[data-locked="true"\][\s\S]+position:\s*sticky[\s\S]+bottom:\s*0/);
  assert.match(css, /\.case-panel\[data-locked="true"\][\s\S]+max-height:\s*55svh/);
  assert.match(css, /\.case-panel\[data-visible="false"\][\s\S]+pointer-events:\s*none/);
  assert.match(main, /max-width:\s*720px/);
  assert.match(main, /panel\.scrollIntoView/);
  assert.match(css, /@media \(max-width:\s*520px\)[\s\S]+\.scene-shell\s*{[\s\S]*height:\s*300px/);
});

test("mobile locked panel has an accessible dismiss control", () => {
  assert.match(dom, /aria-label", "收起详情"/);
  assert.match(dom, /safeHandlers\.dismiss/);
  assert.match(main, /dismiss:\s*\(id\)/);
  assert.match(css, /\.panel-close/);
});

test("personal GLB model is configured with an explicit fallback state", () => {
  assert.match(main, /sceneShell\.dataset\.modelUrl\s*\|\|\s*null/);
  assert.match(main, /onReady:\s*markSceneReady/);
  assert.match(main, /占位人偶 \/ FALLBACK/);
  assert.match(html, /class="scene-shell"[^>]+data-model-url="\.\/assets\/models\/zlm-avatar-q-clean\.glb\?v=20260817-q-avatar-clean"/);
  assert.match(html, /id="avatar-canvas"[^>]+aria-label="可拖拽旋转的个人 3D 模型，双击回到正面"/);
  assert.match(html, /id="scene-status"[^>]+>个人模型 \/ GLB</);
  assert.doesNotMatch(main, /\$\{PROFILE\.name\}的 3D 人偶/);
  assert.match(scene, /可拖拽旋转的个人 3D 模型/);
  assert.match(scene, /gltf\.scene\.scale\.setScalar\(PERSONAL_MODEL_SCALE\)/);
  assert.match(scene, /gltf\.scene\.matrixAutoUpdate = true/);
  assert.match(scene, /const importedRoot = gltf\.scene\.children\[0\]/);
});

test("avatar scene uses moving anchors and orbit drag controls", () => {
  assert.match(scene, /OrbitControls/);
  assert.match(scene, /createCapabilityMarkers/);
  assert.match(scene, /dblclick/);
  assert.match(scene, /enableZoom\s*=\s*false/);
  assert.match(scene, /focusAnchor/);
  assert.match(scene, /camera\.zoom/);
  assert.match(scene, /new OrbitControls\(camera, wrapper\)/);
});

test("the page uses a preprocessed Q-avatar without runtime shoe clipping", () => {
  assert.match(html, /zlm-avatar-q-clean\.glb/);
  assert.doesNotMatch(scene, /applyPedestalClip|localClippingEnabled/);
});

test("avatar regions use moving empty anchors without visible marker geometry", () => {
  assert.doesNotMatch(scene, /feature-glints|createFeatureGlint/);
  assert.match(scene, /marker\.name = `interaction-anchor-/);
  assert.match(main, /CAPABILITY_ITEMS\.map\(\(\{ id, anchor, region \}\) => \(\{ id, anchor, region \}\)\)/);
});

test("the hero exposes moving face and body regions", () => {
  assert.match(contentJs, /region:\s*"face"/);
  assert.match(contentJs, /region:\s*"body"/);
  assert.match(hotspotView, /dataset\.region/);
  assert.match(css, /data-region="face"/);
  assert.match(css, /data-region="body"/);
});

test("projected DOM targets are invisible interaction infrastructure", () => {
  assert.doesNotMatch(hotspotView, /badge-face/);
  const nodeStyles = css.slice(css.indexOf(".capability-node {"), css.indexOf(".skill-sticker:focus-visible"));
  assert.match(nodeStyles, /visibility:\s*hidden/);
  assert.match(css, /\.skill-sticker:focus-visible\s*{[\s\S]*outline:/);
});

test("desktop badge locking keeps the detail panel in the hero", () => {
  assert.doesNotMatch(main, /else\s+scrollToStory\(id\)/);
  assert.match(main, /selectTouch:\s*toggleLock/);
});

test("compact desktop widths use the right-side experience panel", () => {
  assert.match(css, /@media \(min-width:\s*721px\)[\s\S]+\.case-panel[\s\S]+position:\s*absolute/);
  assert.match(css, /@media \(max-width:\s*720px\)[\s\S]+\.case-panel\[data-locked="true"\][\s\S]+position:\s*sticky/);
  assert.match(main, /matchMedia\?\.\("\(max-width: 720px\)"\)/);
});

test("hotspots stay visually hidden while active state reveals the detail", () => {
  const nodeStyles = css.slice(css.indexOf(".capability-node {"), css.indexOf(".capability-node::after"));
  assert.match(nodeStyles, /opacity:\s*0/);
  assert.match(main, /panel\.dataset\.visible\s*=\s*String\(Boolean\(traceId\)\)/);
});

test("the hero shifts from a centered avatar to a right-side experience drawer", () => {
  assert.match(main, /hero\.dataset\.detailVisible\s*=\s*String\(Boolean\(traceId\)\)/);
  assert.match(css, /@media \(min-width: 721px\)[\s\S]+hero\[data-detail-visible="true"\]/);
  assert.match(css, /case-panel\[data-visible="false"\][\s\S]+transform: translateX/);
  assert.match(scene, /DETAIL_CAMERA_SHIFT_X/);
});

test("hover intent survives the camera transition", () => {
  assert.match(main, /HOVER_CLEAR_DELAY\s*=\s*420/);
  assert.match(main, /clearTimer = globalThis\.setTimeout\(\(\) => dispatch\(\{ type: "CLEAR_PREVIEW" \}\), HOVER_CLEAR_DELAY\)/);
  assert.doesNotMatch(hotspotView, /listen\(target, "blur"/);
  assert.doesNotMatch(hotspotView, /listen\(plate, "blur"/);
});

test("long audit heading keeps a deliberate desktop line break", () => {
  assert.match(css, /#ai-audit-story \.story-header h2\s*{[\s\S]*font-size:\s*3\.5rem/);
  const fontSizeDeclarations = css.match(/font-size:\s*[^;]+;/g) ?? [];
  assert.equal(fontSizeDeclarations.some((declaration) => /vw/.test(declaration)), false);
});

test("portfolio links to the related meeting assistant case", () => {
  assert.match(html, /href="\.\.\/\.\.\/meeting-assistant\/"/);
});

test("the avatar uses body targets, one SVG route, and one shared plate", () => {
  assert.match(hotspotView, /className = "skill-sticker"/);
  assert.match(hotspotView, /className = "capability-node"/);
  assert.match(hotspotView, /createElementNS\(SVG_NAMESPACE, "svg"\)/);
  assert.match(hotspotView, /createElementNS\(SVG_NAMESPACE, "path"\)/);
  assert.match(hotspotView, /className = "capability-plate"/);
  assert.match(hotspotView, /export function positionHotspotTargets/);
  assert.match(hotspotView, /export function renderCapabilityTrace/);
  assert.doesNotMatch(hotspotView, /sticker-title|sticker-detail/);
});

test("interactive regions expose stable keyboard and screen reader states", () => {
  assert.match(html, /class="scene-shell"[^>]+role="region"/);
  assert.match(html, /id="hotspot-layer"[^>]+role="group"/);
  assert.match(hotspotView, /className = "skill-sticker"[\s\S]+aria-pressed/);
  assert.match(dom, /className = "fallback-entry"[\s\S]+aria-pressed/);
  assert.match(css, /focus-visible/);
  assert.match(css, /overflow-wrap:\s*anywhere/);
});

test("capability traces use restrained editorial styling", () => {
  assert.match(css, /\.capability-node\s*{/);
  assert.match(css, /background:\s*var\(--acid\)/);
  assert.match(css, /\.capability-trace-path\s*{/);
  assert.match(css, /stroke-width:\s*1/);
  assert.match(css, /\.capability-plate\s*{/);
  assert.match(css, /border-left:\s*4px solid var\(--red\)/);
  assert.match(css, /transition:[^;]*220ms/);
  assert.doesNotMatch(css, /\.skill-sticker[\s\S]{0,500}box-shadow:\s*var\(--shadow\)/);
});

test("nested project timeline entry uses a number without the old red rail", () => {
  assert.match(dom, /className = "project-topline"/);
  assert.match(dom, /"project-index"/);
  const projectStyles = css.slice(css.indexOf(".experience-project {"), css.indexOf(".project-topline {"));
  assert.doesNotMatch(projectStyles, /border-left/);
});

test("capability markers stay hidden until hover and rotation is announced accessibly", () => {
  const nodeStyles = css.slice(css.indexOf(".capability-node {"), css.indexOf(".capability-node::after"));
  assert.match(nodeStyles, /opacity:\s*0;/);
  assert.match(html, /id="avatar-canvas"[^>]+aria-label="[^"]*拖拽旋转[^"]*"/);
});

test("touch exploration keeps compact visible nodes and large targets", () => {
  assert.match(css, /@media \(hover:\s*none\), \(pointer:\s*coarse\)/);
  assert.match(css, /width:\s*44px/);
  assert.match(css, /height:\s*44px/);
  assert.doesNotMatch(css, /@media \(max-width:\s*520px\)[\s\S]+\.skill-sticker\s*{[\s\S]*display:\s*none/);
});

test("the scene uses a neutral map label instead of usage instructions", () => {
  assert.match(html, /02 INTERNSHIP SIGNALS/);
  assert.doesNotMatch(html, /探索贴纸/);
});

test("desktop scene height stays independent from the case panel content", () => {
  assert.match(css, /\.hero\s*{[\s\S]*align-items:\s*start/);
  assert.match(css, /\.scene-shell\s*{[\s\S]*height:\s*calc\(100svh - 56px\)/);
  assert.match(css, /\.case-panel\s*{[\s\S]*max-height:\s*calc\(100svh - 56px\)/);
});

test("keyboard focus follows the capability node instead of drawing a label-like box", () => {
  assert.match(css, /\.skill-sticker:focus-visible\s*{[\s\S]*outline:\s*2px solid var\(--acid\)/);
  assert.match(css, /\.capability-node\s*{[\s\S]*visibility:\s*hidden/);
});

test("the live information plate does not tween away from its route endpoint", () => {
  const plateStyles = css.slice(
    css.indexOf(".capability-plate {"),
    css.indexOf('#hotspot-layer[data-trace-visible="true"] .capability-plate'),
  );
  assert.match(plateStyles, /transition:\s*opacity[^;]*220ms/);
  assert.doesNotMatch(plateStyles, /transition:[^;]*transform/);
});
