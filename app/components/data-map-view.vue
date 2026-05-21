<script lang="ts" setup>
import { assert, keyByToMap } from "@acdh-oeaw/lib";
import * as turf from "@turf/turf";
import type { Feature } from "geojson";
import type { MapGeoJSONFeature } from "maplibre-gl";
import * as v from "valibot";

import MapAdvancedLegendPanel from "@/components/map-advanced-legend-panel.vue";
import type { SearchFormData } from "@/components/search-form.vue";
import type { EntityFeature } from "@/composables/use-create-entity";
import { categories, operatorMap } from "@/composables/use-get-search-results";
import type { CustomMapLegendEntry, GeometryCollectionPoint } from "@/types/api";
import type { CustomGeoJsonFeature, GeoJsonFeature } from "@/utils/create-geojson-feature";

import { project } from "../config/project.config";

const router = useRouter();
const route = useRoute();
const t = useTranslations();

const { getUnprefixedId } = useIdPrefix();

const isMobile = ref(false);

const searchFiltersSchema = v.object({
	category: v.fallback(v.picklist(categories), "entityName"),
	search: v.fallback(v.string(), ""),
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const entitySelectionSchema = v.object({
	selection: v.fallback(v.string(), ""),
});

const searchFilters = computed(() => {
	return v.parse(searchFiltersSchema, route.query);
});

type EntitySelection = v.InferOutput<typeof entitySelectionSchema>;

type SearchFilters = v.InferOutput<typeof searchFiltersSchema>;

function setEntitySelection(query: Partial<EntitySelection>) {
	void router.push({ query: { mode: route.query.mode, ...query } });
}

function onChangeEntitySelection(values: EntityFeature) {
	const temp: EntitySelection = {
		selection: getUnprefixedId(values["@id"]),
	};
	setEntitySelection(temp);
}

function setSearchFilters(query: Partial<SearchFilters>) {
	void router.push({ query: { mode: route.query.mode, ...query } });
}

function onChangeSearchFilters(values: SearchFormData) {
	setSearchFilters(values);
}

onMounted(() => {
	setMovementId({ id: selection.value as unknown as string });
	filterIcons(Object.keys(customIconEntries.value));

	const mq = window.matchMedia("(max-width: 1024px)");

	isMobile.value = mq.matches;

	const handler = (e: MediaQueryListEvent) => {
		isMobile.value = e.matches;
	};

	mq.addEventListener("change", handler);

	onBeforeUnmount(() => {
		mq.removeEventListener("change", handler);
	});
});

const { data, isPending, isPlaceholderData } = useGetSearchResults(
	// @ts-expect-error Includes custom, per-instance system classes.
	computed(() => {
		const { search, category, ...params } = searchFilters.value;

		const operator = operatorMap[category];

		return {
			...params,
			search:
				search.length > 0
					? [{ [category]: [{ operator: operator, values: [search], logicalOperator: "and" }] }]
					: [],
			show: ["geometry", "when", "relations", "types"],
			centroid: true,
			relation_type: ["P26", "P27"],
			system_classes: project.map.mapDisplayedSystemClasses,
			view_classes: ["event"],
			limit: 0,
		};
	}),
);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entities = computed(() => {
	return (
		data.value?.results.flatMap((result) => {
			return result.features;
		}) ?? []
	);
});

const entitiesById = computed(() => {
	return keyByToMap(entities.value, (entity) => {
		return entity.properties._id;
	});
});

const show = ref(false);
const showMovements = computed(() => {
	return Object.keys(filteredCustomMoveEntries.value).length > 0;
});

const movementId = ref<number | null>(null);

function togglePolygons() {
	show.value = !show.value;
}

const selection = computed(() => {
	return route.query.selection;
});

const detailOnMap = computed(() => {
	return route.query.showOnMap;
});

const mode = computed(() => {
	return route.query.mode;
});
/**
 * Reduce size of geojson payload, which has an impact on performance,
 * because `maplibre-gl` will serialize geojson features when sending them to the webworker.
 */
const features = computed(() => {
	const mappedFeatures = entities.value
		.map((entity) => {
			const customConfig = Object.entries(project.map.customIconConfig).findLast(([, cfg]) =>
				entity.types?.some(
					(type) => getUnprefixedId(type.identifier ?? "") === String(cfg.entityType),
				),
			);

			const feature = extractRenderPoint(entity, customConfig != null);

			if (!feature) return null;

			if (customConfig) {
				feature.properties.color = customConfig[1].color;
				feature.properties.size = 10;
				feature.properties.isIcon = true;
			}

			return feature;
		})
		.filter(Boolean) as Array<CustomGeoJsonFeature>;

	mappedFeatures.forEach((feature, featureIdx, self) => {
		let foundIcon = false;

		if (feature.geometry.type === "GeometryCollection") {
			feature.geometry.geometries.forEach((geo) => {
				if (geo.type === "Polygon" && "shapeType" in geo) {
					feature.properties.shapeType = geo.shapeType;
				}

				if (geo.type !== "Point") return;

				const coords = geo.coordinates.join(",");

				const matchingPointFeatures = self.filter((f) => {
					return f.geometry.type === "Point" && f.geometry.coordinates.join(",") === coords;
				});

				if (
					matchingPointFeatures.some((f) => {
						return f.properties.isIcon;
					})
				) {
					foundIcon = true;
				}
			});
		}

		if (feature.geometry.type === "Point") {
			const coords = feature.geometry.coordinates.join(",");

			const matchingPointFeatures = self.filter((f) => {
				return f.geometry.type === "Point" && f.geometry.coordinates.join(",") === coords;
			});

			foundIcon = matchingPointFeatures.some((f) => {
				return f.properties.isIcon && f.properties._id !== feature.properties._id;
			});
		}

		feature.properties.isDisplayed = !foundIcon;
	});

	mappedFeatures.forEach((feature, featureIdx) => {
		if (feature.geometry.type !== "GeometryCollection") return;

		const foundIdx = mappedFeatures.findIndex((f) => {
			if (f.geometry.type !== "GeometryCollection") return false;

			return f.geometry.geometries.some((geo) => {
				return (
					geo.type === "Polygon" &&
					feature.geometry.geometries.find((g) => {
						return g.type === "Polygon" && g.coordinates.join(",") === geo.coordinates.join(",");
					})
				);
			});
		});

		if (foundIdx !== featureIdx) {
			feature.properties.isDisplayed = false;
		}
	});

	return mappedFeatures;
});

function extractRenderPoint(
	entity: EntityFeature,
	convertGeometryCollectionToPoint = false,
): CustomGeoJsonFeature | null {
	if (!entity.geometry) {
		return null;
	}

	if (entity.geometry.type === "Point") {
		return createGeoJsonFeature(entity);
	}

	if (entity.geometry.type === "GeometryCollection") {
		if (!convertGeometryCollectionToPoint) {
			return createGeoJsonFeature(entity);
		}

		const centerpoint = entity.geometry.geometries.find(
			(g): g is GeometryCollectionPoint =>
				g.type === "Point" &&
				g.shapeType === "centerpoint" &&
				!g.title?.includes("(autogenerated)"),
		);

		if (!centerpoint) {
			return createGeoJsonFeature(entity);
		}

		return createGeoJsonFeature({
			...entity,
			geometry: {
				type: "Point",
				coordinates: centerpoint.coordinates,
			},
		});
	}

	return null;
}

// Icon handling
const iconCoordinateSet = computed(() => {
	const set = new Set<string>();

	for (const f of features.value) {
		if (!f.properties.isIcon) continue;

		if (f.geometry.type === "Point") {
			set.add(f.geometry.coordinates.join(","));
		}

		if (f.geometry.type === "GeometryCollection") {
			for (const g of f.geometry.geometries) {
				if (g.type === "Point") {
					set.add(g.coordinates.join(","));
				}
			}
		}
	}

	return set;
});

function isHiddenByIcon(feature: GeoJsonFeature): boolean {
	if (feature.geometry.type === "Point") {
		return iconCoordinateSet.value.has(feature.geometry.coordinates.join(","));
	}

	if (feature.geometry.type === "GeometryCollection") {
		return feature.geometry.geometries
			.filter((g) => g.type === "Point")
			.some((g) => iconCoordinateSet.value.has(g.coordinates.join(",")));
	}

	return false;
}

const movements = computed(() => {
	const move = entities.value
		.filter((move) => {
			return move.systemClass === "move";
		})
		.filter((feature) => {
			return feature.geometry && "geometries" in feature.geometry;
		})
		.map((feature) => {
			assert(feature.geometry, "Feature has no geometry");
			assert("geometries" in feature.geometry, "Feature has no geometries");
			const filteredGeometries = feature.geometry.geometries.filter((geo) => {
				return (
					geo.type === "Point" &&
					geo.shapeType === "centerpoint" &&
					!geo.title?.includes("(autogenerated)")
				);
			});

			const from = feature.relations.find((rel) => {
				return rel.relationType?.startsWith("crm:P27");
			});

			const to = feature.relations.find((rel) => {
				return rel.relationType?.startsWith("crm:P26");
			});

			const fromGeometry = filteredGeometries.find((geo) => {
				return geo.locationId && from?.relationTo?.endsWith(geo.locationId);
			});

			const toGeometry = filteredGeometries.find((geo) => {
				return geo.locationId && to?.relationTo?.endsWith(geo.locationId);
			});

			const featureClone = {
				...feature,
				geometry: {
					...feature.geometry,
					geometries: [fromGeometry, toGeometry].filter((move) => {
						return move != null;
					}),
				},
			};

			return featureClone;
		})
		.filter((move) => {
			return move.geometry.geometries.length === 2;
		});

	move.forEach((move) => {
		assert(move.geometry.geometries);
	});

	return move.map((entity) => {
		const feature = createGeoJsonFeature(entity);

		const customConfig = Object.entries(project.map.customMovementConfig.colorConfig).findLast(
			(entry) => {
				return entity.types?.find((type) => {
					return getUnprefixedId(type.identifier ?? "") === String(entry[1].entityType);
				});
			},
		);
		if (customConfig != null) {
			feature.properties.color = customConfig[1].color;
			feature.properties.isDisplayed =
				customConfig[1].entityType in filteredCustomMoveEntries.value;
		} else {
			feature.properties.isDisplayed =
				(-1) in filteredCustomMoveEntries.value && !isHiddenByIcon(feature);
		}
		return feature;
	});
});

const events = computed(() => {
	return entities.value
		.filter((e) => e.viewClass === "event")
		.map((entity) => {
			const feature = extractRenderPoint(entity);
			if (!feature) return null;

			const customConfig = Object.entries(project.map.customMovementConfig.colorConfig).findLast(
				([, cfg]) =>
					entity.types?.some(
						(type) => getUnprefixedId(type.identifier ?? "") === String(cfg.entityType),
					),
			);

			if (customConfig) {
				feature.properties.color = customConfig[1].color;
			}

			feature.properties.isDisplayed = !isHiddenByIcon(feature);

			return feature;
		})
		.filter(Boolean) as Array<GeoJsonFeature>;
});

const centerpoints = computed(() => {
	return features.value.filter((centerpoint) => {
		return centerpoint.geometry != null && centerpoint.geometry.type === "GeometryCollection";
	});
});

const points = computed(() => {
	return features.value.filter((point) => {
		return point.geometry != null && point.geometry?.type === "Point";
	});
});

const popover = ref<{ coordinates: [number, number]; entities: Array<EntityFeature> } | null>(null);

interface onLayerClickParams {
	features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>;
	targetCoordinates?: Array<[number, number]> | [number, number];
}

function onLayerClick({ features, targetCoordinates }: onLayerClickParams) {
	const entitiesMap = new Map<string, EntityFeature>();

	features.forEach((feature) => {
		const entity = entitiesById.value.get(feature.properties._id);
		if (entity != null) {
			entitiesMap.set(feature.properties._id, entity);
		}
	});

	const entities = Array.from(entitiesMap.values()).filter((e) => {
		return e.geometry != null;
	});

	let coordinates = null;

	if (targetCoordinates != null) {
		if (typeof targetCoordinates[0] === "number" && typeof targetCoordinates[1] === "number") {
			coordinates = targetCoordinates as [number, number];
		} else {
			coordinates = turf.center(turf.points(targetCoordinates as Array<[number, number]>)).geometry
				.coordinates as [number, number];
		}
	} else {
		for (const entity of entities) {
			if (entity.geometry?.type === "GeometryCollection") {
				coordinates = entity.geometry.geometries.find((g) => {
					return g.type === "Point";
				})?.coordinates as [number, number] | undefined;

				if (coordinates != null) break;
			}
		}
	}

	popover.value = {
		coordinates:
			coordinates ??
			(turf.center(createFeatureCollection(entities as Array<Feature>)).geometry.coordinates as [
				number,
				number,
			]),
		entities,
	};
}

watch(data, () => {
	/**
	 * Close popover when search results change, to avoid displaying popup for features which are
	 * no longer in the search results set.
	 */
	popover.value = null;
});

const selectionCoordinates = ref<[number, number] | undefined>(undefined);
const detailSelectionCoordinates = ref<[number, number] | undefined>(undefined);
const selectionBounds = ref<Array<[number, number]> | undefined>(undefined);

function setCoordinates(entity: EntityFeature, coordinates: Ref<[number, number] | undefined>) {
	if (entity.geometry?.type === "GeometryCollection") {
		if (entity.systemClass === "move") {
			const selectedMove = movements.value.find((move) => {
				return move.properties._id === entity.properties._id;
			});
			if (selectedMove?.geometry && "geometries" in selectedMove.geometry) {
				selectionBounds.value = selectedMove.geometry.geometries.map((geo) => {
					assert("coordinates" in geo, "3");
					return geo.coordinates as [number, number];
				});
				assert(selectionBounds.value, "4");

				const points = turf.points(selectionBounds.value);
				coordinates.value = turf.center(points).geometry.coordinates as [number, number];

				return;
			}
		}
		coordinates.value = entity.geometry.geometries.find((g) => {
			return g.type === "Point";
		})?.coordinates as [number, number] | undefined;
		selectionBounds.value = undefined;
	}

	if (entity.geometry?.type === "Point") {
		coordinates.value = entity.geometry.coordinates as unknown as [number, number];
		selectionBounds.value = undefined;
	}
}

watchEffect(() => {
	const showOnMap = detailOnMap.value; // forces dependency tracking
	if (mode.value && selection.value) {
		const entity = entities.value.find((feature) => {
			const id = getUnprefixedId(feature["@id"]);
			return id === selection.value;
		});

		if (entity) {
			setCoordinates(entity, selectionCoordinates);

			if (entity.geometry != null) {
				popover.value = {
					coordinates:
						selectionCoordinates.value ??
						(turf.center(createFeatureCollection([entity as Feature])).geometry.coordinates as [
							number,
							number,
						]),
					entities: [entity],
				};
			}
		}
	}
	detailSelectionCoordinates.value = undefined;
	if (showOnMap) {
		const detailEntity = entities.value.find((feature) => {
			const id = getUnprefixedId(feature["@id"]);
			return id === showOnMap;
		});

		// should there be two popups? --> make popups array / more rendered components??
		if (detailEntity) {
			setCoordinates(detailEntity, detailSelectionCoordinates);

			if (detailSelectionCoordinates.value === undefined) return;
			popover.value = {
				coordinates: detailSelectionCoordinates.value,
				entities: [detailEntity],
			};
		}
	}
});

watch(
	() => {
		return selection.value;
	},
	() => {
		setMovementId({ id: selection.value as unknown as string });
	},
);

const movementDetails = computed(() => {
	if (multipleMovements.data.value) {
		return multipleMovements.data.value;
	} else return null;
});

const linkedMovements = computed(() => {
	if (movementId.value == null || movementDetails.value?.id == null) {
		return null;
	}

	let currentMovement = movementDetails.value;
	let features = [currentMovement];

	while (currentMovement.children && currentMovement.children.length > 0) {
		assert(currentMovement.children[0], "5");
		features = features.concat(currentMovement.children);
		currentMovement = currentMovement.children[0];
	}

	return features.map((movement) => {
		return {
			id: String(movement.id),
			systemClass: movement.system_class ?? "",
		};
	});
});

const multipleMovements = useGetChainedEvents(
	computed(() => {
		return { entityId: movementId.value };
	}),
);

function setMovementId({ id }: { id: string | null }) {
	return (movementId.value = id ? parseInt(id) : null);
}

const customIconEntries = computed(() => {
	const entries: Record<string, CustomMapLegendEntry> = {};

	entities.value.forEach((entity) => {
		const foundType = entity.types?.findLast((type) => {
			return project.map.customIconConfig.find((config) => {
				return String(config.entityType) === getUnprefixedId(type.identifier ?? "");
			});
		});

		if (!foundType) return;

		const unprefixedType = getUnprefixedId(foundType.identifier ?? "");

		if (!(unprefixedType in entries)) {
			const configEntry = project.map.customIconConfig.find((config) => {
				return String(config.entityType) === unprefixedType;
			});

			entries[unprefixedType] = {
				type: foundType,
				icon: configEntry?.iconName,
				color: configEntry?.color,
				entities: [],
			};
		}

		const processedFeature = features.value.find((feature) => {
			return feature.properties._id === entity.properties._id;
		});

		if (!processedFeature) return;

		entries[unprefixedType]?.entities.push(processedFeature);
	});

	return entries;
});

const customMovementEntries = computed(() => {
	const result: Record<string, CustomMapLegendEntry> = {};
	project.map.customMovementConfig.colorConfig.forEach((config) => {
		const matchingMovements = movements.value.filter((move) => {
			return move.properties.types?.find((t) => {
				return getUnprefixedId(t.identifier ?? "") === String(config.entityType);
			});
		});
		if (matchingMovements.length === 0) return;
		const matchingType = matchingMovements[0]?.properties.types?.find((t) => {
			return getUnprefixedId(t.identifier ?? "") === String(config.entityType);
		});
		assert(matchingType != null, "There must be a matching type");
		result[String(config.entityType)] = {
			type: matchingType,
			color: config.color,
			entities: matchingMovements,
		};
	});
	// add default entry to toggle "other movements"
	result[-1] = {
		type: {
			label:
				Object.keys(result).length > 0
					? t("DataMapView.otherMovements")
					: t("DataMapView.showMovement"),
		},
		entities: movements.value.filter((m) => {
			return !Object.values(result)
				.map((entry) => {
					return entry.entities;
				})
				.flat()
				.includes(m);
		}),
		color: project.colors.geojsonMovement,
	};
	return result;
});

const filteredCustomIconEntries = ref<Record<string, CustomMapLegendEntry>>({});
const filteredCustomMoveEntries = ref<Record<string, CustomMapLegendEntry>>({});

function filterIcons(visibleIcons: Array<string>) {
	filteredCustomIconEntries.value = Object.fromEntries(
		Object.entries(customIconEntries.value).filter(([key, _]) => {
			return visibleIcons.includes(key);
		}),
	);
}
function filterMovements(visibleMoves: Array<string>) {
	filteredCustomMoveEntries.value = Object.fromEntries(
		Object.entries(customMovementEntries.value).filter(([key, _]) => {
			return visibleMoves.includes(key);
		}),
	);
}
</script>

<template>
	<MapLegendPanel
		class="z-50 pb-7 lg:pb-0"
		:movements="movements"
		:areas="centerpoints"
		:locations="points"
		@toggle-polygons="togglePolygons"
	/>

	<div class="absolute right-0 bottom-0 z-49 flex pb-20 lg:top-0 lg:z-50 lg:pb-0">
		<MapAdvancedLegendPanel
			:icon-data="customIconEntries"
			:move-data="customMovementEntries"
			@visible-icons="filterIcons"
			@visible-moves="filterMovements"
		/>
	</div>

	<div :class="project.fullscreen ? 'relative grid' : 'relative grid grid-rows-[auto_1fr] gap-4'">
		<div
			:class="
				project.fullscreen ? 'absolute z-10 flex w-full justify-center pointer-events-none' : ''
			"
		>
			<SearchForm
				:class="
					project.fullscreen
						? 'bg-white/90 dark:bg-neutral-900 max-w-[min(800px,49%)] min-w-fit w-full mt-2 rounded-md p-6 shadow-md pointer-events-auto'
						: ''
				"
				:category="searchFilters.category"
				:search="searchFilters.search"
				visualization-type="map"
				@submit="onChangeSearchFilters"
			/>
		</div>

		<VisualisationContainer
			v-slot="{ height, width }"
			class="border"
			:class="{ 'opacity-50 grayscale': isLoading }"
		>
			<GeoMap
				v-if="height && width"
				:features="features"
				:movements="movements"
				:events="events"
				:custom-icons="filteredCustomIconEntries"
				:height="height"
				:width="width"
				:has-polygons="show"
				:show-movements="showMovements"
				:multiple-movements="linkedMovements"
				:current-selection-coordinates="detailSelectionCoordinates || selectionCoordinates"
				:selection-bounds="selectionBounds"
				:current-selection-id="String(selection)"
				:is-mobile="isMobile"
				@layer-click="onLayerClick"
				@movement-hovered="setMovementId"
			>
				<GeoMapPopup
					v-if="popover != null"
					:coordinates="popover.coordinates"
					@close="popover = null"
				>
					<article
						v-for="entity of popover.entities"
						:key="entity.properties._id"
						class="grid gap-1 text-xs"
					>
						<strong class="font-medium">
							<NavLink
								href="#"
								class="flex cursor-pointer items-center gap-1 underline decoration-dotted hover:no-underline"
								@click="onChangeEntitySelection(entity)"
							>
								<Component :is="getEntityIcon(entity.systemClass)" class="size-3.5 shrink-0" />
								{{ entity.properties.title }}
							</NavLink>
						</strong>
						<dl
							v-if="entity.when?.timespans != null && entity.when.timespans.length > 0"
							class="grid grid-cols-[auto_auto] justify-start gap-x-6 gap-y-1 pl-[18px] text-xs text-neutral-600"
						>
							<template v-for="(timespan, index) of entity.when.timespans" :key="index">
								<template v-if="timespan.start?.earliest != null || timespan.start?.latest != null">
									<div class="grid gap-0.5">
										<dt class="font-medium uppercase">{{ t("DataMapView.start-date") }}</dt>
										<dd>{{ createDateSpan(timespan.start) }}</dd>
									</div>
								</template>
								<template v-if="timespan.end?.earliest != null || timespan.end?.latest != null">
									<div class="grid gap-0.5">
										<dt class="font-medium uppercase">{{ t("DataMapView.end-date") }}</dt>
										<dd>{{ createDateSpan(timespan.end) }}</dd>
									</div>
								</template>
							</template>
						</dl>
					</article>
				</GeoMapPopup>
			</GeoMap>

			<Centered v-if="isLoading" class="pointer-events-none">
				<LoadingIndicator class="text-neutral-950" size="lg" />
			</Centered>
		</VisualisationContainer>
	</div>
</template>
