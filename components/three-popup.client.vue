<script lang="ts" setup>
import { assert } from "@acdh-oeaw/lib";
import type { Map as GeoMap, Popup } from "maplibre-gl";
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

onMounted(async () => {
	await nextTick();
	const { map } = geoMapContext;
	assert(elementRef.value != null);
	assert(map != null);

	console.log("entered & initialized");

	const customLayer = {
		id: "3d-popup",
		type: "custom" as const,
		renderingMode: "3d" as const,
		onAdd(map: GeoMap, gl: WebGLRenderingContext) {
			console.log("onAdd function entered");
			console.log("Creating Threebox instance", gl.getSupportedExtensions());
			try {
				Object.defineProperty(map, "version", {
					get: function () {
						return 1.0;
					},
				});
				window.tb = new Threebox(map, gl, {});
			} catch (error) {
				console.error(error);
			}
			console.log("threebox created", window.tb);

			const obj = window.tb.label({ htmlElement: elementRef.value, alwaysVisible: true });

			obj.setCoords([props.coordinates[0], props.coordinates[1], 50]);

			window.tb.add(obj);
		},
		render() {
			if (!window.tb) {
				console.warn("Threebox is not initialized yet, skipping render");
				return;
			}
			console.log("Rendering Threebox scene...");
			window.tb.update();
		},
	};

	if (!map.getLayer("3d-popup")) {
		map.addLayer(customLayer);
	}
});

onScopeDispose(() => {
	context.popup?.remove();
});
</script>

<template>
	<div
		ref="elementRef"
		class="invisible grid max-h-80 gap-3 overflow-y-auto"
		data-geo-map-popup="true"
	>
		<slot />
	</div>
</template>
