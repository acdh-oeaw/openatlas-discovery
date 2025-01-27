<script lang="ts" setup>
import "maplibre-gl/dist/maplibre-gl.css";

import { assert } from "@acdh-oeaw/lib";
import * as turf from "@turf/turf";
import {
	FullscreenControl,
	type GeoJSONSource,
	Map as GeoMap,
	type MapGeoJSONFeature,
	NavigationControl,
	ScaleControl,
} from "maplibre-gl";

import { type GeoMapContext, geoMapContextKey } from "@/components/geo-map.context";
import { initialViewState } from "@/config/geo-map.config";
import { project } from "@/config/project.config";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";

const props = defineProps<{
	features: Array<GeoJsonFeature>;
	movements: Array<GeoJsonFeature>;
	height: number;
	width: number;
	hasPolygons?: boolean;
	showMovements: boolean;
}>();

const emit = defineEmits<{
	(
		event: "layer-click",
		features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
	): void;
}>();

const env = useRuntimeConfig();
const theme = useColorMode();

const colors = {
	points: project.colors.geojsonPoints,
	areaCenterPoints: project.colors.geojsonAreaCenterPoints,
	movement: project.colors.geojsonMovement,
};

const mapStyle = computed(() => {
	return theme.value === "dark" ? env.public.mapBaselayerUrlDark : env.public.mapBaselayerUrlLight;
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
		maxZoom: 24,
		minZoom: 1,
		pitch: initialViewState.pitch,
		style: mapStyle.value,
		zoom: initialViewState.zoom,
	});

	context.map = map;

	map.on("load", init);
}

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

	const sourcePointsId = "points-data";
	const sourcePolygonsId = "polygon-data";
	const sourceCenterPointsId = "centerpoints-data";
	const sourceMovePointsId = "move-points-data";
	map.addSource(sourcePointsId, { type: "geojson", data: createFeatureCollection([]) });
	map.addSource(sourcePolygonsId, { type: "geojson", data: createFeatureCollection([]) });
	map.addSource(sourceCenterPointsId, { type: "geojson", data: createFeatureCollection([]) });
	map.addSource(sourceMovePointsId, { type: "geojson", data: createFeatureCollection([]) });

	//

	map.addLayer({
		id: "points",
		type: "circle",
		source: sourcePointsId,
		filter: ["==", "$type", "Point"],
		paint: {
			"circle-color": colors.points,
			"circle-radius": 6,
		},
	});

	//

	map.addLayer({
		id: "centerpoints",
		type: "circle",
		source: sourceCenterPointsId,
		filter: ["==", "$type", "Point"],
		paint: {
			"circle-color": colors.areaCenterPoints,
			"circle-radius": 6,
		},
	});

	//

	map.addLayer({
		id: "movements",
		type: "circle",
		source: sourceMovePointsId,
		filter: ["==", "$type", "Point"],
		paint: {
			"circle-color": colors.movement,
			"circle-radius": 6,
		},
	});

	//

	map.on("click", "points", (event) => {
		emit(
			"layer-click",
			(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
		);
	});

	map.on("click", "centerpoints", (event) => {
		emit(
			"layer-click",
			(event.features ?? []) as Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>,
		);
	});

	//

	map.on("mouseenter", "points", () => {
		map.getCanvas().style.cursor = "pointer";
	});

	map.on("mouseenter", "centerpoints", () => {
		map.getCanvas().style.cursor = "pointer";
	});

	//

	map.on("mouseleave", "points", () => {
		map.getCanvas().style.cursor = "";
	});

	map.on("mouseleave", "centerpoints", () => {
		map.getCanvas().style.cursor = "";
	});

	map.on("mouseleave", "polygons", () => {
		map.getCanvas().style.cursor = "";
	});

	//

	updateScope();
	updatePolygons();
}

function dispose() {
	context.map?.remove();
}

watch(() => {
	return props.features;
}, updateScope);

watch(() => {
	return props.hasPolygons;
}, updatePolygons);

watch(() => {
	return props.showMovements;
}, updateMovements);

function updateScope() {
	assert(context.map != null);

	const map = context.map;

	const sourcePointsId = "points-data";
	const sourcePolygonsId = "polygon-data";
	const sourceCenterPointsId = "centerpoints-data";
	const sourceMovePointsId = "move-points-data";
	const sourcePoints = map.getSource(sourcePointsId) as GeoJSONSource | undefined;
	const sourcePolygons = map.getSource(sourcePolygonsId) as GeoJSONSource | undefined;
	const sourceCenterpoints = map.getSource(sourceCenterPointsId) as GeoJSONSource | undefined;
	const sourceMovePoints = map.getSource(sourceMovePointsId) as GeoJSONSource | undefined;

	const points = props.features.filter((point) => {
		return point.geometry.type === "Point";
	});

	const polygons = props.features.filter((polygon) => {
		return polygon.geometry.type === "GeometryCollection" || polygon.geometry.type === "Polygon";
	});

	const centerpoints = props.features.filter((centerpoint) => {
		return centerpoint.geometry.type === "GeometryCollection";
	});

	const movements = props.movements;

	const geojsonPoints = createFeatureCollection(points);
	const geojsonPolygons = createFeatureCollection(polygons);
	const geojsonCenterPoints = createFeatureCollection(centerpoints);
	const geojsonMovePoints = createFeatureCollection(movements);

	sourcePoints?.setData(geojsonPoints);
	sourcePolygons?.setData(geojsonPolygons);
	sourceCenterpoints?.setData(geojsonCenterPoints);
	sourceMovePoints?.setData(geojsonMovePoints);

	if (geojsonPoints.features.length > 0) {
		const bounds = turf.bbox(geojsonPoints) as [number, number, number, number];
		map.fitBounds(bounds, { padding: 50, maxZoom: 16 });
	} else if (geojsonCenterPoints.features.length > 0) {
		const bounds = turf.bbox(geojsonCenterPoints) as [number, number, number, number];
		map.fitBounds(bounds, { padding: 50 });
	}
}

function updatePolygons() {
	assert(context.map != null);
	const sourcePolygonsId = "polygon-data";

	if (props.hasPolygons) {
		context.map.addLayer({
			id: "polygons",
			type: "fill",
			source: sourcePolygonsId,
			paint: {
				"fill-color": colors.areaCenterPoints,
				"fill-opacity": 0.35,
			},
		});
	}
	if (!props.hasPolygons && context.map.getLayer("polygons")) {
		context.map.removeLayer("polygons");
	}
}

function updateMovements() {
	assert(context.map != null);
	console.log("entered", props.movements);

	const sourceMoveLinesId = "move-lines-data";

	if (!context.map.getSource(sourceMoveLinesId)) {
		context.map.addSource(sourceMoveLinesId, {
			type: "geojson",
			data: createFeatureCollection([]),
		});
	}

	// Process the GeoJSON movements array to create curved lines
	const curvedMovements: GeoJSON.FeatureCollection<GeoJSON.LineString> = {
		type: "FeatureCollection",
		features: props.movements
			.map((movement) => {
				if (movement.geometry.type === "GeometryCollection") {
					const geometries = movement.geometry.geometries;

					if (geometries.length < 2) {
						console.warn("Invalid geometries or not enough points:", geometries);
						return null;
					}

					const startPoint = geometries[0];
					const endPoint = geometries[1];

					if (
						startPoint?.type === "Point" &&
						endPoint?.type === "Point" &&
						Array.isArray(startPoint.coordinates) &&
						Array.isArray(endPoint.coordinates)
					) {
						// Create a curved line between the two points
						const arc = drawArc(startPoint.coordinates, endPoint.coordinates);
						console.log("ARC", arc);
						return drawArc(startPoint.coordinates, endPoint.coordinates);
					} else {
						console.warn("Start or End Point is not valid:", { startPoint, endPoint });
						return null;
					}
				} else {
					console.warn("Movement is not a GeometryCollection:", movement);
					return null;
				}
			})
			.filter((feature): feature is GeoJSON.Feature<GeoJSON.LineString> => {
				return feature !== null;
			}),
	};

	console.log(curvedMovements);
	const sourceMoveLines = context.map.getSource(sourceMoveLinesId) as GeoJSONSource | undefined;
	sourceMoveLines?.setData(curvedMovements);

	if (props.showMovements) {
		if (!context.map.getLayer("movement-line")) {
			context.map.addLayer({
				id: "movement-line",
				type: "line",
				source: sourceMoveLinesId,
				layout: {
					"line-join": "round",
					"line-cap": "round",
				},
				paint: {
					"line-color": colors.movement,
					"line-width": 5,
					"line-opacity": 0.5,
				},
			});
		}
	} else if (context.map.getLayer("movement-line")) {
		context.map.removeLayer("movement-line");
	}
}

function drawArc(start: GeoJSON.Position, end: GeoJSON.Position) {
	let route: GeoJSON.LineString = {
		type: "LineString",
		coordinates: [start, end],
	};

	route = turf.toWgs84(route);
	const lineD = turf.distance(start, end);
	const mp = turf.midpoint(route.coordinates[0] as turf.Coord, route.coordinates[1] as turf.Coord);
	const center = turf.destination(
		mp,
		lineD,
		turf.bearing(route.coordinates[0] as turf.Coord, route.coordinates[1] as turf.Coord) - 90,
	);

	console.log("distance", turf.distance(center, route.coordinates[0] as turf.Coord));
	console.log(turf.bearing(center, route.coordinates[1] as turf.Coord));
	console.log(turf.bearing(center, route.coordinates[0] as turf.Coord));
	const lA = turf.lineArc(
		center,
		turf.distance(center, route.coordinates[0] as turf.Coord),
		turf.bearing(center, route.coordinates[1] as turf.Coord),
		turf.bearing(center, route.coordinates[0] as turf.Coord),
	);

	return turf.toMercator(lA);
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
