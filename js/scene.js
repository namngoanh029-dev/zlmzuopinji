import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/addons/loaders/DRACOLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { isAnchorFacingCamera } from "./avatar-interaction.js";

const DRACO_DECODER_PATH =
  "https://cdn.jsdelivr.net/npm/three@0.169.0/examples/jsm/libs/draco/gltf/";
const PERSONAL_MODEL_SCALE = 3.1;
const DETAIL_CAMERA_SHIFT_X = 0.78;

export function projectAvatarAnchors(items, avatar, camera, wrapper) {
  if (!avatar || !camera || !wrapper) return {};
  const rect = wrapper.getBoundingClientRect();
  const point = new THREE.Vector3();
  const cameraWorld = new THREE.Vector3();
  const cameraLocal = new THREE.Vector3();
  const positions = {};

  avatar.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);
  camera.getWorldPosition(cameraWorld);
  cameraLocal.copy(cameraWorld);
  avatar.worldToLocal(cameraLocal);

  for (const item of items ?? []) {
    if (!item?.id || !Array.isArray(item.anchor)) continue;

    point.set(...item.anchor).applyMatrix4(avatar.matrixWorld).project(camera);
    positions[item.id] = {
      x: ((point.x + 1) * rect.width) / 2,
      y: ((1 - point.y) * rect.height) / 2,
      visible:
        point.x >= -1 && point.x <= 1 &&
        point.y >= -1 && point.y <= 1 &&
        point.z >= -1 && point.z <= 1 &&
        isAnchorFacingCamera(item.anchor, cameraLocal.toArray()),
    };
  }

  return positions;
}

export function createAvatarScene({
  canvas,
  modelUrl,
  anchors = [],
  onAnchors,
  onReady,
  onFallback,
} = {}) {
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-3, 3, 3, -3, 0.1, 100);
  camera.position.set(0, 0.45, 7);
  camera.lookAt(0, 0.2, 0);

  const studioSet = createStudioSet();
  scene.add(studioSet);

  const avatar = new THREE.Group();
  scene.add(avatar);
  const fallback = makeFallbackAvatar();
  configureMeshShadows(fallback);
  avatar.add(fallback);
  const markerView = createCapabilityMarkers(anchors);
  avatar.add(markerView.group);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9b4aa, 1.7));
  const key = new THREE.DirectionalLight(0xfff4df, 1.5);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd9e5ff, 1.15);
  fill.position.set(-4, 2, 3);
  scene.add(fill);
  const spotlight = new THREE.SpotLight(0xfff4df, 32, 18, Math.PI / 5, 0.55, 1.4);
  spotlight.position.set(-2.4, 5.2, 4.5);
  spotlight.castShadow = true;
  spotlight.shadow.mapSize.set(1024, 1024);
  spotlight.shadow.camera.near = 0.5;
  spotlight.shadow.camera.far = 18;
  spotlight.shadow.bias = -0.0001;
  spotlight.target.position.set(0, 0.3, 0);
  scene.add(spotlight, spotlight.target);

  const wrapper = canvas?.parentElement ?? null;
  const poster = wrapper?.querySelector?.("#avatar-poster");
  if (canvas) {
    canvas.setAttribute(
      "aria-label",
      canvas.getAttribute("aria-label") || "可拖拽旋转的个人 3D 模型，双击回到正面",
    );
    canvas.style.zIndex = "2";
    canvas.style.touchAction = "none";
  }

  let renderer = null;
  let frameId = null;
  let disposed = false;
  let fallbackNotified = false;
  let modelReady = false;
  let cleanupLoader = () => {};
  let cleanupControls = () => {};
  let controls = null;
  let focusedAnchorId = null;
  const defaultFocusTarget = new THREE.Vector3(0, 0.2, 0);
  const focusTargets = new Map(
    (anchors ?? [])
      .filter((item) => item?.id && Array.isArray(item.anchor))
      .map((item) => [item.id, new THREE.Vector3(item.anchor[0] + DETAIL_CAMERA_SHIFT_X, 0.2, 0)]),
  );
  const focusTarget = new THREE.Vector3().copy(defaultFocusTarget);

  try {
    if (!canvas) throw new Error("Avatar canvas is unavailable");
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(globalThis.window?.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
  } catch (error) {
    notifyFallback(error);
  }

  const resize = () => {
    if (!renderer || !canvas) return;
    const rect = canvas.parentElement?.getBoundingClientRect?.() ?? {
      width: canvas.clientWidth || 1,
      height: canvas.clientHeight || 1,
    };
    const width = Math.max(1, rect.width || 1);
    const height = Math.max(1, rect.height || 1);
    renderer.setSize(width, height, false);
    const halfHeight = 3;
    const aspect = width / height;
    camera.top = halfHeight;
    camera.bottom = -halfHeight;
    camera.left = -halfHeight * aspect;
    camera.right = halfHeight * aspect;
    camera.updateProjectionMatrix();
  };

  const reduceMotion = () =>
    globalThis.window?.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;

  const raf =
    globalThis.window?.requestAnimationFrame?.bind(globalThis.window) ??
    ((callback) => globalThis.setTimeout(() => callback(Date.now()), 16));
  const cancelRaf =
    globalThis.window?.cancelAnimationFrame?.bind(globalThis.window) ??
    ((id) => globalThis.clearTimeout(id));

  const setupControls = () => {
    if (!renderer || !canvas || !wrapper) return;
    controls = new OrbitControls(camera, wrapper);
    wrapper.style.touchAction = "none";
    controls.target.set(0, 0.2, 0);
    controls.enableDamping = !reduceMotion();
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.enableRotate = true;
    controls.rotateSpeed = 0.56;
    controls.minPolarAngle = Math.PI / 2 - 0.16;
    controls.maxPolarAngle = Math.PI / 2 + 0.16;
    controls.update();
    controls.saveState();

    const handleStart = () => {
      wrapper?.classList?.add("is-dragging");
      if (document.activeElement?.classList?.contains("skill-sticker")) {
        document.activeElement.blur();
      }
    };
    const handleEnd = () => wrapper?.classList?.remove("is-dragging");
    const handleDoubleClick = () => resetView();
    controls.addEventListener("start", handleStart);
    controls.addEventListener("end", handleEnd);
    canvas.addEventListener("dblclick", handleDoubleClick);
    globalThis.window?.addEventListener?.("pointerup", handleEnd);
    globalThis.window?.addEventListener?.("pointercancel", handleEnd);
    cleanupControls = () => {
      controls?.removeEventListener("start", handleStart);
      controls?.removeEventListener("end", handleEnd);
      canvas.removeEventListener("dblclick", handleDoubleClick);
      globalThis.window?.removeEventListener?.("pointerup", handleEnd);
      globalThis.window?.removeEventListener?.("pointercancel", handleEnd);
      controls?.dispose?.();
      controls = null;
      wrapper.style.touchAction = "";
      wrapper?.classList?.remove("is-dragging");
    };
  };

  const frame = (time) => {
    if (disposed) return;
    controls?.update();
    if (controls) {
      focusTarget.copy(focusTargets.get(focusedAnchorId) ?? defaultFocusTarget);
      controls.target.lerp(focusTarget, 0.12);
      const nextZoom = focusedAnchorId ? 1.16 : 1;
      camera.zoom += (nextZoom - camera.zoom) * 0.12;
      camera.updateProjectionMatrix();
      controls.update();
    }
    avatar.updateMatrixWorld(true);
    camera.updateMatrixWorld(true);
    markerView.animate(time, reduceMotion());
    onAnchors?.(projectAvatarAnchors(anchors, avatar, camera, wrapper));
    if (renderer) {
      renderer.render(scene, camera);
      if (wrapper && controls) {
        wrapper.dataset.rotationEnabled = "true";
        wrapper.dataset.cameraAzimuth = controls.getAzimuthalAngle().toFixed(3);
        wrapper.dataset.cameraZoom = camera.zoom.toFixed(3);
      }
      if (modelReady && poster) {
        wrapper?.classList?.add("is-live");
        poster.setAttribute("aria-hidden", "true");
      }
    }
    frameId = raf(frame);
  };

  if (renderer) {
    setupControls();
    resize();
    globalThis.window?.addEventListener?.("resize", resize);
    frameId = raf(frame);
  }

  if (renderer && modelUrl) {
    const loader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath(DRACO_DECODER_PATH);
    loader.setDRACOLoader(draco);
    try {
      loader.load(
        modelUrl,
        (gltf) => {
          if (disposed) {
            disposeObject3D(gltf.scene);
            return;
          }
          fallback.visible = false;
          configureMeshShadows(gltf.scene);
          gltf.scene.matrixAutoUpdate = true;
          gltf.scene.matrix.identity();
          gltf.scene.position.set(0, 0, 0);
          gltf.scene.rotation.set(0, 0, 0);
          const importedRoot = gltf.scene.children[0];
          if (importedRoot) {
            importedRoot.matrixAutoUpdate = true;
            importedRoot.matrix.identity();
            importedRoot.position.set(0, 0, 0);
            importedRoot.rotation.set(0, 0, 0);
            importedRoot.scale.set(1, 1, 1);
          }
          gltf.scene.scale.setScalar(PERSONAL_MODEL_SCALE);
          avatar.add(gltf.scene);
          modelReady = true;
          onReady?.();
        },
        undefined,
        (error) => {
          if (disposed) return;
          notifyFallback(error);
        },
      );
    } catch (error) {
      notifyFallback(error);
    }
    cleanupLoader = () => draco.dispose?.();
  } else if (renderer) {
    notifyFallback(new Error("Avatar model URL is unavailable"));
  }

  const dispose = () => {
    if (disposed) return;
    disposed = true;
    if (frameId !== null) cancelRaf(frameId);
    globalThis.window?.removeEventListener?.("resize", resize);
    cleanupLoader?.();
    cleanupControls();
    disposeObject3D(avatar);
    disposeObject3D(studioSet);
    renderer?.dispose?.();
  };

  return {
    scene,
    camera,
    avatar,
    renderer,
    controls,
    markers: markerView.markers,
    setActiveMarker: markerView.setActive,
    focusAnchor: (id) => {
      focusedAnchorId = id && focusTargets.has(id) ? id : null;
    },
    resetView,
    resize,
    dispose,
  };

  function resetView() {
    if (!controls) return;
    focusedAnchorId = null;
    const damping = controls.enableDamping;
    controls.enableDamping = false;
    controls.reset();
    controls.update();
    controls.enableDamping = damping;
    controls.update();
    wrapper?.classList?.remove("is-dragging");
  }

  function notifyFallback(_error) {
    if (disposed || fallbackNotified) return;
    fallbackNotified = true;
    if (wrapper) wrapper.dataset.modelStatus = "fallback";
    onFallback?.();
  }
}

export function createStudioSet() {
  const group = new THREE.Group();
  group.name = "white-studio-set";

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 12),
    new THREE.MeshStandardMaterial({ color: 0xf4f1e8, roughness: 0.92, metalness: 0 }),
  );
  backdrop.name = "studio-backdrop";
  backdrop.position.set(0, 2.5, -1.8);
  backdrop.receiveShadow = true;

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 8),
    new THREE.MeshStandardMaterial({ color: 0xe9e6dc, roughness: 0.92, metalness: 0 }),
  );
  floor.name = "studio-floor";
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, -2.25, 0);
  floor.receiveShadow = true;

  group.add(backdrop, floor);
  return group;
}

function configureMeshShadows(root) {
  root?.traverse?.((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
  });
}

export function createCapabilityMarkers(items = []) {
  const group = new THREE.Group();
  group.name = "capability-markers";
  const markers = new Map();

  for (const item of items ?? []) {
    if (!item?.id || !Array.isArray(item.anchor)) continue;
    const marker = new THREE.Group();
    marker.name = `interaction-anchor-${item.id}`;
    marker.position.set(...item.anchor);
    marker.userData.region = item.region ?? "face";
    marker.userData.active = false;
    marker.visible = true;
    group.add(marker);
    markers.set(item.id, marker);
  }

  return {
    group,
    markers,
    setActive: (id) => {
      for (const [markerId, marker] of markers) {
        marker.userData.active = markerId === id;
      }
    },
    animate: () => {},
  };
}

export function disposeObject3D(root) {
  const disposedGeometries = new Set();
  const disposedMaterials = new Set();
  const disposedTextures = new Set();
  const disposedSkeletons = new Set();

  const disposeTexture = (texture) => {
    if (!texture || disposedTextures.has(texture)) return;
    disposedTextures.add(texture);
    texture.dispose?.();
  };

  root?.traverse?.((object) => {
    if (!object.isMesh) return;

    if (object.geometry && !disposedGeometries.has(object.geometry)) {
      disposedGeometries.add(object.geometry);
      object.geometry.dispose?.();
    }

    const materials = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of materials) {
      if (!material || disposedMaterials.has(material)) continue;
      disposedMaterials.add(material);
      for (const value of Object.values(material)) {
        if (value?.isTexture) disposeTexture(value);
      }
      material.dispose?.();
    }

    const skeleton = object.skeleton;
    if (skeleton && !disposedSkeletons.has(skeleton)) {
      disposedSkeletons.add(skeleton);
      const boneTexture = skeleton.boneTexture;
      disposeTexture(boneTexture);
      if (skeleton.boneTexture === boneTexture) skeleton.boneTexture = null;
      skeleton.dispose?.();
    }
  });
}

function makeFallbackAvatar() {
  const group = new THREE.Group();
  const skin = new THREE.MeshStandardMaterial({ color: 0xc9886a, roughness: 0.86 });
  const cloth = new THREE.MeshStandardMaterial({ color: 0xe8e1d4, roughness: 0.92 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x2e3b31, roughness: 0.9 });
  const accent = new THREE.MeshStandardMaterial({ color: 0xd8ff55, roughness: 0.84 });

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.72, 12, 8), skin);
  head.scale.set(0.86, 1.08, 0.8);
  head.position.y = 1.7;
  group.add(head);

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.27, 0.34, 8), skin);
  neck.position.y = 0.96;
  group.add(neck);

  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.88, 1.35, 5, 10), cloth);
  body.position.y = 0.15;
  group.add(body);

  for (const x of [-0.98, 0.98]) {
    const arm = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 1.02, 4, 8), cloth);
    arm.position.set(x, 0.2, 0);
    arm.rotation.z = x < 0 ? -0.1 : 0.1;
    group.add(arm);

    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), skin);
    hand.position.set(x * 1.03, -0.43, 0);
    group.add(hand);
  }

  for (const x of [-0.46, 0.46]) {
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 1.15, 5, 8), dark);
    leg.position.set(x, -1.35, 0);
    group.add(leg);

    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.22, 0.82), accent);
    shoe.position.set(x, -2.08, 0.12);
    group.add(shoe);
  }

  return group;
}
