<script lang="ts" setup>
import "maplibre-gl/dist/maplibre-gl.css";

import { assert } from "@acdh-oeaw/lib";
import type * as deck from "@deck.gl/core";
import { LayerExtension } from "@deck.gl/core";
import { ArcLayer } from "@deck.gl/layers";
import * as mapbox from "@deck.gl/mapbox";
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
	multipleMovementIds: Array<{ id: string; systemClass: string }> | null;
}>();

const emit = defineEmits<{
	(
		event: "layer-click",
		args: {
			features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>;
			targetCoordinates?: Array<[number, number]> | [number, number];
		},
	): void;
	(
		event: "movement-hovered",
		args: {
			id: string | null;
		},
	): void;
}>();

const env = useRuntimeConfig();
const theme = useColorMode();

const hoveredMovementId = ref<string | null>(null);
const movementLinesLayer = ref<unknown>(new ArcLayer());
const curvedMovements = ref<Array<CurvedMovementLine> | null>(null);

const updatedCurvedMovements = computed(() => {
	return applyTiltToMatchingArcs(curvedMovements.value ?? []);
});

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

watch(
	() => {
		return props.multipleMovementIds;
	},
	(newVal, oldVal) => {
		if (newVal !== oldVal) {
			console.log(props.multipleMovementIds);
		}
	},
	{ immediate: true },
);

watch(
	() => {
		return hoveredMovementId.value;
	},
	(newId) => {
		console.log("update hoveredMovementId: ", hoveredMovementId.value);
		updateArcLayerColors(updatedCurvedMovements.value);
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
		from: 0,
		to: 1000,
		duration: 5000,
		repeat: Infinity,
		onUpdate: updateLayers,
	});

	const layer = new ArcLayer({
		id: "arc",
		data: updatedCurvedMovements.value,
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
		getTilt: (d) => {
			return d.tilt || 0;
		},
		getWidth: 3,
		updateTriggers: {
			getSourceColor: coefficient.value,
			getTargetColor: coefficient.value,
		},
		coef: coefficient.value,
		extensions: [new ArcBrushingLayer()],
	});

	const supportLayer = new ArcLayer({
		id: "arc-support",
		data: updatedCurvedMovements.value,
		getSourcePosition: (d) => {
			return d.coordinates[0];
		},
		getTargetPosition: (d) => {
			return d.coordinates[1];
		},
		getWidth: 20,
		pickable: true,
		opacity: 0,
		onHover: (info) => {
			if (info.object != null) {
				hoveredMovementId.value = info.object.id || null;
				emit("movement-hovered", { id: hoveredMovementId.value });
			} else {
				hoveredMovementId.value = null;
				emit("movement-hovered", { id: null });
			}
		},
		onClick: (info) => {
			if (info.object != null) {
				console.log("Clicked Arc:", info.object);

				const clickedMovement = props.movements.find((movement) => {
					return movement.properties._id === info.object.id;
				});

				if (clickedMovement) {
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
		getTilt: (d) => {
			return d.tilt || 0;
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
function isSameCoordinates(arc1: CurvedMovementLine, arc2: CurvedMovementLine): boolean {
	return (
		arc1.coordinates[0][0] === arc2.coordinates[0][0] &&
		arc1.coordinates[0][1] === arc2.coordinates[0][1] &&
		arc1.coordinates[1][0] === arc2.coordinates[1][0] &&
		arc1.coordinates[1][1] === arc2.coordinates[1][1]
	);
}

function applyTiltToMatchingArcs(
	curvedMovements: Array<CurvedMovementLine>,
): Array<CurvedMovementLine> {
	return curvedMovements.map((arc, index, array) => {
		let tiltValue = 0;

		const matchingArcs = array.filter((otherArc, otherIndex) => {
			return index !== otherIndex && isSameCoordinates(arc, otherArc);
		});

		if (matchingArcs.length > 0) {
			tiltValue = (index % 2 === 0 ? 1 : -1) * 5;
		}

		return {
			...arc,
			tilt: tiltValue, // Store the tilt value on the arc
		};
	});
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

function updateLayers(currentTime: number) {
	if (overlay.value) {
		coefficient.value = currentTime / 1000;
		if (hoveredMovementId.value === null) {
			overlay.value.setProps({
				layers: overlay.value._props.layers.map((layer) => {
					return layer.id === "arc" ? layer.clone({ coef: coefficient.value }) : layer;
				}),
			});
		} else {
			overlay.value.setProps({
				layers: overlay.value._props.layers.map((layer) => {
					return layer.id === "arc"
						? layer.clone({
								coef: coefficient.value,
								getSourceColor: (d) => {
									if (props.multipleMovementIds != null && hoveredMovementId.value != null) {
										const isHovered: boolean = d.id === hoveredMovementId.value;
										const moves = props.multipleMovementIds.some((move) => {
											return move.id === d.id;
										});

										if (isHovered || moves) {
											return d.color;
										} else {
											return [128, 128, 128];
										}
									} else return d.color;
								},
								getTargetColor: (d) => {
									if (props.multipleMovementIds != null && hoveredMovementId.value != null) {
										const isHovered: boolean = d.id === hoveredMovementId.value;
										const moves: boolean = props.multipleMovementIds.some((move) => {
											return move.id === d.id;
										});

										if (isHovered || moves) {
											return d.color;
										} else {
											return [128, 128, 128];
										}
									} else return d.color;
								},
							})
						: layer;
				}),
			});
		}
	}
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
				if (props.multipleMovementIds != null && hoveredMovementId.value != null) {
					const isHovered: boolean = d.id === hoveredMovementId.value;
					const moves: boolean = props.multipleMovementIds.some((move) => {
						return move.id === d.id;
					});
					if (isHovered || moves) {
						return d.color;
					} else {
						return [128, 128, 128];
					}
				} else return d.color;
			},
			getTargetColor: (d) => {
				if (props.multipleMovementIds != null && hoveredMovementId.value != null) {
					const isHovered: boolean = d.id === hoveredMovementId.value;
					const moves: boolean = props.multipleMovementIds.some((move) => {
						return move.id === d.id;
					});

					if (isHovered || moves) {
						return d.color;
					} else {
						return [128, 128, 128];
					}
				} else return d.color;
			},
			getTilt: (d) => {
				return d.tilt || 0;
			},
			getWidth: 3,
			updateTriggers: {
				getSourceColor: [hoveredMovementId.value, props.multipleMovementIds],
				getTargetColor: [hoveredMovementId.value, props.multipleMovementIds],
			},
			coef: coefficient.value / 1000,
			extensions: [new ArcBrushingLayer()],
		});

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
