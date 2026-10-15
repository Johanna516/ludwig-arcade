import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

/* Basis gerüst */
const canvas = document.getElementById("arcade-canvas");
const canvasWrap = canvas.parentElement;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

function resizeRenderer() {
  const w = canvasWrap.clientWidth;
  const h = canvasWrap.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}
resizeRenderer();

/* licht */
scene.add(new THREE.AmbientLight(0x707890, 3.4));
scene.add(camera);

const keyLight = new THREE.PointLight(0xffffff, 85, 14);
keyLight.position.set(0, 0.4, 1);
camera.add(keyLight);

const cyanLight = new THREE.PointLight(0x4cf3ff, 34, 12);
cyanLight.position.set(-1.2, 0.6, 0.8); // relativ zur Kamera, leicht links
camera.add(cyanLight);

const magentaLight = new THREE.PointLight(0xff3ea5, 30, 12);
magentaLight.position.set(1.2, -0.3, 0.6); // relativ zur Kamera, leicht rechts
camera.add(magentaLight);

const softPinkLight = new THREE.PointLight(0xffc2e0, 24, 14);
softPinkLight.position.set(0.6, 1.3, -0.9);
camera.add(softPinkLight);

/* steuerung */
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = false;
controls.enablePan = false;
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.autoRotate = true;
controls.autoRotateSpeed = 0.6; // klein = langsam
const CURSOR_GRAB = 'url("cursor-grab.png") 12 12, grab';
const CURSOR_GRABBING = 'url("cursor-grabbing.png") 12 12, grabbing';

canvas.style.cursor = CURSOR_GRAB;
renderer.domElement.addEventListener("pointerdown", () => (canvas.style.cursor = CURSOR_GRABBING));
window.addEventListener("pointerup", () => (canvas.style.cursor = CURSOR_GRAB));

/* laden zentrieren und co */
const cabinet = new THREE.Group();
scene.add(cabinet);

const TARGET_HEIGHT = 2.2;
const NEUTRAL_DIRECTION = new THREE.Vector3(0.6, 0.35, 1).normalize();

function frameObject(object, offset = 1.35) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const maxSize = Math.max(size.x, size.y, size.z);
  const fitHeightDistance = maxSize / (2 * Math.tan((Math.PI * camera.fov) / 360));
  const fitWidthDistance = fitHeightDistance / camera.aspect;
  const distance = offset * Math.max(fitHeightDistance, fitWidthDistance);

  camera.position.copy(center).addScaledVector(NEUTRAL_DIRECTION, distance);
  camera.near = distance / 100;
  camera.far = distance * 100;
  camera.updateProjectionMatrix();

  controls.target.copy(center);
  controls.update();
}

const loader = new GLTFLoader();
loader.load(
  "ludwig.glb",
  (gltf) => {
    const model = gltf.scene;

    const box = new THREE.Box3().setFromObject(model);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);

    const scaleFactor = TARGET_HEIGHT / size.y;
    model.scale.setScalar(scaleFactor);
    model.position.set(
      -center.x * scaleFactor,
      -center.y * scaleFactor + TARGET_HEIGHT / 2, // Unterkante auf y = 0
      -center.z * scaleFactor
    );

    cabinet.add(model);
    frameObject(cabinet);
  },
  undefined,
  (error) => console.error("Konnte ludwig.glb nicht laden:", error)
);

/* für resize anpassen */
window.addEventListener("resize", () => {
  resizeRenderer();
  if (cabinet.children.length > 0) frameObject(cabinet);
});


function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}
animate();
