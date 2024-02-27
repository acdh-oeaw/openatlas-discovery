<script lang="ts" setup>
import "maplibre-gl/dist/maplibre-gl.css";

import { assert } from "@acdh-oeaw/lib";
import * as turf from "@turf/turf";
import type { FeatureCollection } from "geojson";
import {
	FullscreenControl,
	type GeoJSONSource,
	Map as GeoMap,
	type MapGeoJSONFeature,
	NavigationControl,
	ScaleControl,
} from "maplibre-gl";
import { watch } from "vue";

import { type GeoMapContext, geoMapContextKey } from "@/components/geo-map.context";
import { initialViewState } from "@/config/geo-map.config";
import { project } from "@/config/project.config";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";

const props = defineProps({
	features: {
		type: Array<GeoJsonFeature>,
		required: true,
	},
	height: {
		type: Number,
		required: true,
	},
	width: {
		type: Number,
		required: true,
	},
	adaptiveZoom: {
		type: Boolean,
		default: false,
	},
});

const emit = defineEmits<{
	(
		event: "layer-click",
		features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
	): void;
}>();

const env = useRuntimeConfig();
const theme = useColorMode();

const colors = {
	default: project.colors.geojson,
};

const mapStyle = computed(() => {
	return theme.value === "dark"
		? env.public.NUXT_PUBLIC_MAP_BASELAYER_URL_DARK
		: env.public.NUXT_PUBLIC_MAP_BASELAYER_URL_LIGHT;
});

const elementRef = ref<HTMLElement | null>(null);

const context: GeoMapContext = {
	map: null,
};

onMounted(create);
onScopeDispose(dispose);

async function create() {
	await nextTick();
	assert(elementRef.value != null);

	const map = new GeoMap({
		center: [initialViewState.longitude, initialViewState.latitude],
		container: elementRef.value,
		maxZoom: defaultMaxZoom,
		minZoom: 1,
		pitch: initialViewState.pitch,
		style: mapStyle.value,
		zoom: initialViewState.zoom,
	});

	context.map = map;

	map.on("load", init);
}

const sourceId = "data";
function init() {
	assert(context.map != null);
	const map = context.map;

	//

	const nav = new NavigationControl({});
	map.addControl(nav, "top-left");

	//

	const fullscreen = new FullscreenControl({});
	map.addControl(fullscreen, "top-right");

	//

	const scale = new ScaleControl({});
	map.addControl(scale, "bottom-left");

	//

	map.addSource(sourceId, { type: "geojson", data: createFeatureCollection([]) });

	//

	map.addLayer({
		id: "points",
		type: "circle",
		source: sourceId,
		filter: ["==", "$type", "Point"],
		paint: {
			"circle-color": colors.default,
			"circle-radius": 6,
		},
	});

	//

	map.addLayer({
		id: "polygons",
		type: "fill",
		source: sourceId,
		filter: ["==", "$type", "Polygon"],
		paint: {
			"fill-color": colors.default,
			"fill-opacity": 0.35,
		},
	});

	//

	map.on("click", "points", (event) => {
		emit(
			"layer-click",
			(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
		);
	});

	map.on("click", "polygons", (event) => {
		emit(
			"layer-click",
			(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
		);
	});

	//

	map.on("mouseenter", "points", () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseenter", "polygons", () => {
		map.getCanvas().style.cursor = "pointer";
	});

	//

	map.on("mouseleave", "points", () => {
		map.getCanvas().style.cursor = "";
	});

	map.on("mouseleave", "polygons", () => {
		map.getCanvas().style.cursor = "";
	});

	//

	update();
}

function dispose() {
	context.map?.remove();
}
const zoomLimit = 20;
const maxArea = 1000;
const minArea = 1;
const defaultMaxZoom = 16;

let geojson: FeatureCollection | null = null;
let area = 0;
let point: FeatureCollection | null = null;
let zoomBreakPoint = defaultMaxZoom;
const showPoint = ref(false);



watch(showPoint, () => {
	const source = context.map?.getSource(sourceId) as GeoJSONSource | undefined;
	if (!source || !point || !geojson) return;

	showPoint.value ? source.setData(point) : source.setData(geojson);
})

/**
 * Gets the breakpoint for the zoom level based on the area.
 * The smaller the area, the higher the zoom level.
 */
function getBreakpoint(): number {
	if (!props.adaptiveZoom || !props.features.length || !geojson || !area) return defaultMaxZoom - 2;

	if (area < minArea) return zoomLimit - 2;
	if (area > maxArea) return zoomBreakPoint = defaultMaxZoom - 2;

	return Math.round((area - minArea) / (maxArea - minArea) * (zoomLimit - defaultMaxZoom) + defaultMaxZoom) - 2;
}

function getMaxZoom() {
	if (!props.adaptiveZoom || !props.features.length || !geojson || !area) return defaultMaxZoom;

	if (area < minArea) return zoomLimit;
	if (area > maxArea) return defaultMaxZoom;

	return Math.round((area - minArea) / (maxArea - minArea) * (zoomLimit - defaultMaxZoom) + defaultMaxZoom);
}

watch(() => {
	return props.features;
}, update);

function resetData(map: GeoMap, source?: GeoJSONSource) {
	map.setMaxZoom(defaultMaxZoom);
	source?.setData(createFeatureCollection([]));
	point = null;
	area = 0;
}

function update() {
	assert(context.map != null);
	const map = context.map;

	const source = map.getSource(sourceId) as GeoJSONSource | undefined;
	geojson = createFeatureCollection(props.features);

	if (!geojson.features.length) {
		resetData(map, source);
		return;
	}

	point = turf.centroid(geojson);

	const bounds = turf.bbox(geojson);
	area = turf.area(geojson);
	map.setMaxZoom(getMaxZoom()); // Needs to be called after setting the area in order to work
	zoomBreakPoint = getBreakpoint();

	source?.setData(geojson);

	if (props.adaptiveZoom) {
		map.on("zoom", () => {
			if (map.getZoom() < zoomBreakPoint) {
				showPoint.value = true;
			} else {
				showPoint.value = false;
			}
		});
	}

	map.fitBounds(bounds, { padding: 50 });
}

defineExpose(context);
provide(geoMapContextKey, context);
</script>

<template>
	<div class="relative grid size-full text-black">
		<div ref="elementRef" data-geo-map="true" />
		<slot />
	</div>
</template>
