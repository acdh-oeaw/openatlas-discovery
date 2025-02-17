<script lang="ts" setup>
import "maplibre-gl/dist/maplibre-gl.css";

import { assert } from "@acdh-oeaw/lib";
import type * as deck from "@deck.gl/core";
import { LayerExtension } from "@deck.gl/core";
import { ArcLayer } from "@deck.gl/layers";
import * as mapbox from "@deck.gl/mapbox";
import { SimpleMeshLayer } from "@deck.gl/mesh-layers";
import { load } from "@loaders.gl/core";
import { OBJLoader } from "@loaders.gl/obj";
import * as turf from "@turf/turf";
import {
	FullscreenControl,
	type GeoJSONSource,
	Map as GeoMap,
	type MapGeoJSONFeature,
	NavigationControl,
	ScaleControl,
} from "maplibre-gl";
import { animate } from "popmotion";

import { type GeoMapContext, geoMapContextKey } from "@/components/geo-map.context";
import { initialViewState } from "@/config/geo-map.config";
import { project } from "@/config/project.config";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";

interface CurvedMovementLine {
	id: string;
	coordinates: [deck.Position, deck.Position];
	color: deck.Color;
}

const overlay = ref<mapbox.MapboxOverlay | null>(null);
const supportOverlay = ref<mapbox.MapboxOverlay | null>(null);
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
		args: {
			features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>;
			targetCoordinates?: Array<[number, number]> | [number, number];
		},
	): void;
}>();

const env = useRuntimeConfig();
const theme = useColorMode();

const hoveredMovementId = ref<string | null>(null);
const movementLinesLayer = ref<unknown>(new ArcLayer());
const curvedMovements = ref<Array<CurvedMovementLine> | null>(null);
const zoomFactor = ref<number>(0);
const currentScale = ref<[number, number, number]>([7000, 7000, 7000]);
const chevronMesh = ref<unknown>(null);
const coefficient = ref(0);
const colors = {
	points: project.colors.geojsonPoints,
	areaCenterPoints: project.colors.geojsonAreaCenterPoints,
	movement: project.colors.geojsonMovement,
};

const ArcBrushingShader = {
	name: "brushing-shader",
	inject: {
		"vs:#decl": `
         uniform float coef;
        `,
		"vs:#main-end": `
        vec4 colorA = instanceTargetColors;
    		vec4 colorB = vec4(colorA.rgb, 0.2);
    		float pct = step(coef, segmentRatio);
    		vColor = mix(colorA, colorB, pct);
                    `,
		"fs:#main-start": `
        if (vColor.a == 0.0) discard;
                    `,
	},
};
class ArcBrushingLayer extends LayerExtension {
	override getShaders() {
		return ArcBrushingShader;
	}

	override updateState({ props, oldProps, context }) {
		const model = this._getModel();
		if (props.coef !== oldProps.coef) {
			model.setUniforms({ coef: props.coef });
		}
	}
}

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
		maxPitch: 85,
		antialias: true,
	});

	context.map = map;

	map.on("load", init);
	chevronMesh.value = (await load("/assets/3d-objects/chevron.obj", OBJLoader)) as unknown;
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
			"circle-color": hoveredMovementId.value
				? ["match", ["get", "id"], hoveredMovementId.value, colors.movement, "#808080"]
				: colors.movement,
			"circle-radius": 6,
		},
	});

	//

	map.on("click", "points", (event) => {
		emit("layer-click", {
			features: (event.features ?? []) as Array<
				MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">
			>,
		});
	});

	map.on("click", "centerpoints", (event) => {
		emit("layer-click", {
			features: (event.features ?? []) as Array<
				MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">
			>,
		});
	});

	//

	map.on("mouseenter", "points", () => {
		map.getCanvas().classList.add("!cursor-pointer");
	});

	map.on("mouseenter", "centerpoints", () => {
		map.getCanvas().classList.add("!cursor-pointer");
	});

	//

	map.on("mouseleave", "points", () => {
		map.getCanvas().classList.remove("!cursor-pointer");
	});

	map.on("mouseleave", "centerpoints", () => {
		map.getCanvas().classList.remove("!cursor-pointer");
	});

	map.on("mouseleave", "polygons", () => {
		map.getCanvas().classList.remove("!cursor-pointer");
	});

	map.on("zoom", () => {
		zoomFactor.value = map.getZoom();
	});

	//

	updateScope();
	updatePolygons();
}

function dispose() {
	context.map?.remove();
}

// watch(
// 	() => {
// 		return zoomFactor.value;
// 	},
// 	() => {
// 		console.log(zoomFactor.value);
// 		updateArcLayerColors(curvedMovements.value);
// 	},
// );

watch(() => {
	return props.features;
}, updateScope);

watch(() => {
	return props.hasPolygons;
}, updatePolygons);

watch(() => {
	return props.showMovements;
}, updateMovements);

watch(
	() => {
		return hoveredMovementId.value;
	},
	(newId) => {
		console.log("update hoveredMovementId: ", hoveredMovementId.value);
		updateArcLayerColors(curvedMovements.value);
		if (context.map != null) {
			context.map.getCanvas().classList.toggle("!cursor-pointer", newId != null);
			context.map.setPaintProperty(
				"movements",
				"circle-color", // The paint property
				hoveredMovementId.value
					? ["match", ["get", "_id"], hoveredMovementId.value, colors.movement, "#808080"]
					: colors.movement, // If no movement is hovered, use the default color for all
			);
		}
	},
	{ immediate: true },
);

// watch(
// 	() => {
// 		return zoomFactor.value;
// 	},
// 	() => {
// 		// Update the scale based on the zoom level
// 		if (zoomFactor.value) {
// 			updateArcLayerColors(curvedMovements.value);
// 		}
// 	},
// 	{ immediate: true },
// );

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
	// Process the GeoJSON movements array to create curved lines
	curvedMovements.value = props.movements
		.flatMap((movement) => {
			if (movement.geometry.type === "GeometryCollection") {
				const geometries = movement.geometry.geometries;
				const points = geometries.filter((geometry) => {
					return geometry.type === "Point";
				});
				if (points.length < 2) {
					return null;
				}
				return points.slice(1).map((point, index) => {
					const startPoint = points[index];
					const endPoint = point;

					if (!startPoint) return null;

					if (Array.isArray(startPoint.coordinates) && Array.isArray(endPoint.coordinates)) {
						// Create a curved line between the two points
						return {
							id: movement.properties._id,
							coordinates: [startPoint.coordinates, endPoint.coordinates],
							color: hexToRgb(colors.movement),
						};
					} else {
						return null;
					}
				});
			} else {
				return null;
			}
		})
		.filter((feature) => {
			return feature !== null;
		}) as Array<CurvedMovementLine>;

	const currentTimeAnimation = animate({
		from: 0, // currentTime min value
		to: 1000, // currentTime max value
		duration: 5000, // over the course of 5 seconds
		repeat: Infinity,
		onUpdate: updateLayers,
	});

	const layer = new ArcLayer({
		id: "arc",
		data: curvedMovements.value,
		getSourcePosition: (d) => {
			return d.coordinates[0];
		},
		getTargetPosition: (d) => {
			return d.coordinates[1];
		},
		getSourceColor: (d) => {
			return [255, 165, 0];
		},
		getTargetColor: (d) => {
			return d.color;
		},
		getWidth: 3,
		updateTriggers: {
			getSourceColor: hoveredMovementId.value,
			getTargetColor: hoveredMovementId.value,
		},
		coef: coefficient.value,
		extensions: [new ArcBrushingLayer()],
	});

	// const meshLayer = new SimpleMeshLayer<CurvedMovementLine>({
	// 	id: "meshLayer",
	// 	data: curvedMovements.value,
	// 	getColor: (d: CurvedMovementLine) => {
	// 		return hoveredMovementId.value
	// 			? d.id === hoveredMovementId.value
	// 				? d.color
	// 				: [128, 128, 128, 128]
	// 			: d.color;
	// 	},
	// 	getOrientation: (d: CurvedMovementLine) => {
	// 		return [
	// 			45,
	// 			turf.angle(
	// 				[d.coordinates[0][0] + 1, d.coordinates[0][1]],
	// 				d.coordinates[0],
	// 				d.coordinates[1],
	// 			),
	// 			0,
	// 		];
	// 	},
	// 	getPosition: (d: CurvedMovementLine) => {
	// 		return [
	// 			...turf.center(turf.points(d.coordinates as Array<[number, number]>)).geometry.coordinates,
	// 			turf.distance(d.coordinates[0], d.coordinates[1], { units: "meters" }) / 2,
	// 		];
	// 	},
	// 	mesh: chevronMesh.value as string,
	// 	getScale: () => {
	// 		return currentScale.value;
	// 	},
	// 	pickable: true,
	// });

	const supportLayer = new ArcLayer({
		id: "arc-support",
		data: curvedMovements.value,
		getSourcePosition: (d) => {
			return d.coordinates[0];
		},
		getTargetPosition: (d) => {
			return d.coordinates[1];
		},
		getWidth: 20,
		pickable: true,
		opacity: 0,
		onHover: (d) => {
			if (d.object != null) {
				hoveredMovementId.value = d.object.id || null;
			} else {
				hoveredMovementId.value = null;
			}
		},
		onClick: (info) => {
			if (info.object != null) {
				console.log("Clicked Arc:", info.object);

				const clickedMovement = props.movements.find((movement) => {
					return movement.properties._id === info.object.id;
				});

				if (clickedMovement) {
					console.log("Found clicked movement:", clickedMovement);
					emit("layer-click", {
						features: [clickedMovement] as Array<
							MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">
						>,
						targetCoordinates: info.object.coordinates.map((point: { 0: number; 1: number }) => {
							return [point[0], point[1]];
						}),
					});
				} else {
					console.warn("Movement not found for clicked arc.");
				}
			} else {
				console.warn("No object clicked.");
			}
		},
		updateTriggers: {
			getSourceColor: hoveredMovementId.value,
			getTargetColor: hoveredMovementId.value,
		},
	});

	movementLinesLayer.value = layer;

	assert(context.map != null);

	if (props.showMovements) {
		overlay.value = new mapbox.MapboxOverlay({
			layers: [movementLinesLayer.value] as deck.LayersList,
			interleaved: true,
		});

		context.map.addControl(overlay.value);
		supportOverlay.value = new mapbox.MapboxOverlay({
			layers: [supportLayer] as deck.LayersList,
		});

		context.map.addControl(supportOverlay.value);
	} else {
		if (overlay.value && supportOverlay.value) {
			overlay.value.finalize();
			supportOverlay.value.finalize();
			context.map.removeControl(overlay.value);
			context.map.removeControl(supportOverlay.value);
		}
	}
}

function hexToRgb(hex: string) {
	var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	return result
		? ([
				parseInt(result[1] ?? "0", 16),
				parseInt(result[2] ?? "0", 16),
				parseInt(result[3] ?? "0", 16),
			] as deck.Color)
		: null;
}

// Lerp function for smooth transitions
function lerp(start: number, end: number, t: number) {
	return start + t * (end - start);
}

function updateLayers(currentTime: number) {
	if (overlay.value) {
		coefficient.value = currentTime / 1000;
		overlay.value.setProps({
			layers: overlay.value._props.layers.map((layer) => {
				return layer.id === "arc" ? layer.clone({ coef: coefficient.value }) : layer;
			}),
		});
	}
}

function updateScaleSmoothly() {
	const smoothingFactor = 0.1;
	// const targetScale = Math.max(
	// 	20, // Minimum scale
	// 	Math.pow(2, 14 - zoomFactor.value * 0.7), // Less aggressive exponential decay
	// );

	const targetScale = Math.max(
		20, // Minimum scale
		7000 - (zoomFactor.value / 11) * (7000 - 20),
	);

	// Interpolate scale
	currentScale.value = currentScale.value.map((scaleValue) => {
		return lerp(scaleValue, targetScale, smoothingFactor);
	}) as [number, number, number];

	return currentScale.value;
}

function updateArcLayerColors(movements: Array<CurvedMovementLine> | null) {
	if (overlay.value) {
		const updatedLayer = new ArcLayer({
			id: "arc", // Same ID to update the existing layer
			data: movements ?? [],
			getSourcePosition: (d) => {
				return d.coordinates[0];
			},
			getTargetPosition: (d) => {
				return d.coordinates[1];
			},
			getSourceColor: (d) => {
				return hoveredMovementId.value
					? d.id === hoveredMovementId.value
						? d.color
						: [128, 128, 128, 128]
					: d.color;
			},
			getTargetColor: (d) => {
				return hoveredMovementId.value
					? d.id === hoveredMovementId.value
						? d.color
						: [128, 128, 128, 50]
					: d.color;
			},
			getWidth: 3,
			updateTriggers: {
				getSourceColor: hoveredMovementId.value,
				getTargetColor: hoveredMovementId.value,
			},
		});

		// const updatedMeshLayer = new SimpleMeshLayer<CurvedMovementLine>({
		// 	id: "meshLayer",
		// 	data: curvedMovements.value,
		// 	getColor: (d: CurvedMovementLine) => {
		// 		return hoveredMovementId.value
		// 			? d.id === hoveredMovementId.value
		// 				? d.color
		// 				: [128, 128, 128, 128]
		// 			: d.color;
		// 	},
		// 	getOrientation: (d: CurvedMovementLine) => {
		// 		return [
		// 			45,
		// 			turf.angle(
		// 				[d.coordinates[0][0] + 1, d.coordinates[0][1]],
		// 				d.coordinates[0],
		// 				d.coordinates[1],
		// 			),
		// 			0,
		// 		];
		// 	},
		// 	getPosition: (d: CurvedMovementLine) => {
		// 		return [
		// 			...turf.center(turf.points(d.coordinates as Array<[number, number]>)).geometry
		// 				.coordinates,
		// 			turf.distance(d.coordinates[0], d.coordinates[1], { units: "meters" }) / 2,
		// 		];
		// 	},
		// 	mesh: chevronMesh.value as string,
		// 	getScale: () => {
		// 		return updateScaleSmoothly();
		// 	},
		// 	pickable: true,
		// 	updateTriggers: {
		// 		getColor: hoveredMovementId.value, // Ensure color update triggers
		// 		getScale: zoomFactor.value, // Ensure position update triggers
		// 	},
		// });

		// console.log(updatedMeshLayer);
		overlay.value.setProps({
			layers: [updatedLayer],
			interleaved: true,
		});
	}
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
