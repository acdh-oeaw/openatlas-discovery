<script lang="ts" setup>
import { assert } from "@acdh-oeaw/lib";
import type { WebGLRenderer } from "@types/three";
import { type Map as GeoMap, MercatorCoordinate, type Popup } from "maplibre-gl";
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { Threebox } from "threebox-plugin";

const props = defineProps<{
	coordinates: [number, number];
}>();

console.log("entered");

const emit = defineEmits<{
	(event: "close"): void;
}>();

const geoMapContext = useGeoMap();

const elementRef = ref<HTMLElement | null>(null);

interface Context {
	popup: Popup | null;
}

const context: Context = {
	popup: null,
};

const renderer = ref<WebGLRenderer | null>(null);
const camera = ref<THREE.Camera | null>(null);
const scene = ref<THREE.Scene | null>(null);

onMounted(async () => {
	await nextTick();
	const { map } = geoMapContext;
	assert(elementRef.value != null);
	assert(map != null);

	console.log(props.coordinates[0], props.coordinates[1]);
	console.log("set elementRef", elementRef);
	const popup = new CSS2DObject(elementRef.value);
	console.log("set popup position", popup.position.set(props.coordinates[0], props.coordinates[1]));

	popup.position.set(props.coordinates[0], props.coordinates[1]);
	popup.center.set(props.coordinates[0], props.coordinates[1]);
	popup.layers.set(0);

	const modelOrigin: [number, number] = [props.coordinates[0], props.coordinates[1]];
	const modelAltitude = 0;
	const modelRotate = [Math.PI / 2, 0, 0];

	const modelAsMercatorCoordinate = MercatorCoordinate.fromLngLat(modelOrigin, modelAltitude);

	const modelTransform = {
		translateX: modelAsMercatorCoordinate.x,
		translateY: modelAsMercatorCoordinate.y,
		translateZ: modelAsMercatorCoordinate.z,
		rotateX: modelRotate[0],
		rotateY: modelRotate[1],
		rotateZ: modelRotate[2],
		/* Since our 3D model is in real world meters, a scale transform needs to be
		 * applied since the CustomLayerInterface expects units in MercatorCoordinates.
		 */
		scale: modelAsMercatorCoordinate.meterInMercatorCoordinateUnits(),
	} as const;

	console.log("entered & initialized");

	const customLayer = {
		id: "3d-popup",
		type: "custom" as const,
		renderingMode: "3d" as const,
		onAdd(map: GeoMap, gl: WebGLRenderingContext) {
			console.log("entered onAdd");

			camera.value = new THREE.Camera();
			scene.value = new THREE.Scene();

			// create two three.js lights to illuminate the model
			const directionalLight = new THREE.DirectionalLight(0xffffff);
			directionalLight.position.set(0, -70, 100).normalize();
			scene.value.add(directionalLight);

			const directionalLight2 = new THREE.DirectionalLight(0xffffff);
			directionalLight2.position.set(0, 70, 100).normalize();
			scene.value.add(directionalLight2);

			scene.value.add(popup);

			// use the MapLibre GL JS map canvas for three.js
			renderer.value = new THREE.WebGLRenderer({
				canvas: map.getCanvas(),
				context: gl,
				antialias: true,
			});

			renderer.value.autoClear = false;

			console.log(renderer.value);
			console.log("renderer initialized", scene.value, camera.value);
		},
		render() {
			console.log("render function entered");

			if (!camera.value || !scene.value) {
				console.error("Camera or scene is null, stopping render");
				return;
			}

			const rotationX = new THREE.Matrix4().makeRotationAxis(
				new THREE.Vector3(1, 0, 0),
				modelTransform.rotateX ?? 0,
			);
			console.log("Rotation X matrix created:", rotationX);

			const rotationY = new THREE.Matrix4().makeRotationAxis(
				new THREE.Vector3(0, 1, 0),
				modelTransform.rotateY ?? 0,
			);
			console.log("Rotation Y matrix created:", rotationY);

			const rotationZ = new THREE.Matrix4().makeRotationAxis(
				new THREE.Vector3(0, 0, 1),
				modelTransform.rotateZ ?? 0,
			);
			console.log("Rotation Z matrix created:", rotationZ);

			console.log("matrix ready");
			renderer.value?.resetState();
			renderer.value?.render(scene.value, camera.value);
		},
	};

	if (!map.getLayer("3d-popup")) {
		map.addLayer(customLayer);
	}
});

watch(
	() => {
		return props.coordinates;
	},
	(coordinates) => {
		context.popup?.setLngLat(coordinates);
	},
);

onScopeDispose(() => {
	context.popup?.remove();
});
</script>

<template>
	<div ref="elementRef" class="grid max-h-80 gap-3 overflow-y-auto" data-geo-map-popup="true">
		<slot />
	</div>
</template>
