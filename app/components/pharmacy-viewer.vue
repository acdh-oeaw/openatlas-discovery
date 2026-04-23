<script setup lang="ts">
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

const router = useRouter();
const route = useRoute();

const canvasRef = ref<HTMLCanvasElement | undefined>(undefined);
const isLoading = ref(true);

let scene = new THREE.Scene();
let camera: THREE.PerspectiveCamera;
let renderer: THREE.WebGLRenderer;
let controls: OrbitControls;
const placedHotspots: THREE.Mesh[] = [];

let hoveredHotspot: THREE.Mesh | null = null;

type HotspotData = {
	id: string;
	position: [number, number, number];
	entityId: string;
};

const hotspotData: HotspotData[] = [];
const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

const loadingManager = new THREE.LoadingManager();
loadingManager.onLoad = () => {
	isLoading.value = false;
};

const gltfLoader = new GLTFLoader(loadingManager);
gltfLoader.setMeshoptDecoder(MeshoptDecoder);

onMounted(() => {
	const canvas = canvasRef.value;
	console.log(canvas);

	const sizes = {
		width: window.innerWidth,
		height: window.innerHeight,
	};

	window.addEventListener("resize", () => {
		// Update sizes
		sizes.width = window.innerWidth;
		sizes.height = window.innerHeight;

		// Update camera
		camera.aspect = sizes.width / sizes.height;
		camera.updateProjectionMatrix();

		// Update renderer
		renderer.setSize(sizes.width, sizes.height);
		renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
	});

	/**
	 * Camera
	 */
	// Base camera
	camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100);
	camera.position.set(-4.09, 3.36, -1.14); // 2.79
	scene.add(camera);

	// Load Model
	gltfLoader.load("/models/pharmacy/test-optimized.glb", (gltf) => {
		gltf.scene.rotation.x = -0.101592653589793;
		scene.add(gltf.scene);

		// 		window.addEventListener("click", (event) => {
		//   if (!placementMode) return;

		//   const rect = canvasRef.value!.getBoundingClientRect();

		// mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		// mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

		//   raycaster.setFromCamera(mouse, camera);

		//   const hits = raycaster.intersectObject(gltf.scene, true);

		//   if (!hits.length) return;

		//   const hit = hits[0];

		// const point = hit.point.clone();
		// const normal = hit.face?.normal.clone();

		// if (!normal) return;

		// // transform normal to world space
		// normal.transformDirection(hit.object.matrixWorld);

		// // push hotspot slightly above surface
		// point.add(normal.multiplyScalar(0.02));

		//   // create visual hotspot
		//   const hotspot = createHotspot();
		//   hotspot.position.copy(point);

		//   scene.add(hotspot);
		//   placedHotspots.push(hotspot);

		//   // store data
		//   const data: HotspotData = {
		//     id: `hotspot_${hotspotData.length + 1}`,
		//     position: [point.x, point.y, point.z],
		//   };

		//   hotspotData.push(data);

		//   console.log("Hotspot saved:", data);
		// });
	});

	const directionalLight = new THREE.AmbientLight("#ffffff", 1);
	directionalLight.position.set(-4, 6.5, 2.5);
	scene.add(directionalLight);

	// Controls
	controls = new OrbitControls(camera, canvas);
	controls.target.y = 3.5;
	controls.enableDamping = true;
	controls.enableZoom = false;
	controls.enablePan = false;

	/**
	 * Renderer
	 */
	renderer = new THREE.WebGLRenderer({
		canvas: canvas,
		antialias: true, // fix stair-like effect
	});
	renderer.setSize(sizes.width, sizes.height);
	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	window.addEventListener("pointermove", (event) => {
		if (canvas === undefined) return;
		const rect = canvas.getBoundingClientRect();

		mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
	});

	window.addEventListener("click", onClickHotspot);

	/**
	 * Animate
	 */
	const tick = () => {
		controls.update();

		// hover detection
		raycaster.setFromCamera(mouse, camera);

		const hits = raycaster.intersectObjects(placedHotspots, false);

		hoveredHotspot = hits.length ? (hits[0]?.object as THREE.Mesh) : null;

		// smooth scale animation
		placedHotspots.forEach((h) => {
			const isHovered = h === hoveredHotspot;

			const targetScale = isHovered ? 1.8 : 1;

			h.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.12);
		});

		renderer.render(scene, camera);
		requestAnimationFrame(tick);
	};

	tick();
});

function createHotspot() {
	const mesh = new THREE.Mesh(
		new THREE.SphereGeometry(0.2, 16, 16),
		new THREE.MeshBasicMaterial({
			color: 0xffffff,
			depthTest: false,
		}),
	);

	return mesh;
}

function createHotspots(data: HotspotData[]) {
	data.forEach((item) => {
		const hotspot = createHotspot();

		hotspot.position.set(item.position[0], item.position[1], item.position[2]);

		hotspot.userData = item;

		scene.add(hotspot);
		placedHotspots.push(hotspot);
	});
}

function exportHotspots() {
	const json = JSON.stringify(hotspotData, null, 2);

	const blob = new Blob([json], { type: "application/json" });
	const url = URL.createObjectURL(blob);

	const a = document.createElement("a");
	a.href = url;
	a.download = "pharmacy-hotspots.json";
	a.click();

	URL.revokeObjectURL(url);
}

function onClickHotspot() {
	if (!hoveredHotspot) return;

	const data = hoveredHotspot.userData as HotspotData;
	if (!data?.entityId) return;

	router.push({
		query: {
			...route.query,
			selection: data.entityId,
		},
	});
}

watch(isLoading, async (val) => {
	if (val === false) {
		const res = await fetch("/data/pharmacy-hotspots-big-items.json");
		const hotspots = await res.json();

		createHotspots(hotspots);
	}
});

onBeforeUnmount(() => {
	renderer?.dispose();
	controls?.dispose();
});
</script>

<template>
	<div class="relative">
		<!-- <button
  		class="absolute top-4 left-4 bg-white text-black p-2"
  		@click="exportHotspots"
		>
  			Export hotspots
		</button> -->
		<canvas ref="canvasRef"></canvas>

		<Centered v-if="isLoading" class="pointer-events-none">
			<LoadingIndicator class="text-white" size="lg" />
		</Centered>
	</div>
</template>
