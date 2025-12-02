<script lang="ts" setup>
import { isNonEmptyString, keyByToMap } from "@acdh-oeaw/lib";
import type { Geometry } from "geojson";
import * as v from "valibot";

import EntityImages from "@/components/entity-images.vue";
import type { Image } from "@/components/entity-primary-details.vue";
import TooltipContent from "@/components/ui/tooltip/TooltipContent.vue";
import TooltipTrigger from "@/components/ui/tooltip/TooltipTrigger.vue";
import type { PresentationViewModel } from "@/types/api";
import { hasCoordinates } from "@/utils/has-geojson-coordinates";

// defineRouteRules({
// 	prerender: true,
// });

const requestURL = useRequestURL();

definePageMeta({
	title: "EntityPage.meta.title",
	middleware: "database-check",
	validate(route) {
		const paramsSchema = v.object({
			id: v.pipe(v.unknown(), v.transform(Number), v.number(), v.integer(), v.minValue(1)),
		});
		return v.safeParse(paramsSchema, route.params).success;
	},
});

const t = useTranslations();

const route = useRoute();
const id = computed(() => {
	return Number(route.params.id as string);
});

const { data, isPending, isPlaceholderData } = useGetEntity(
	computed(() => {
		return { entityId: id.value };
	}),
);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entity: ComputedRef<PresentationViewModel | undefined> = computed(() => {
	return data.value;
});

const entities = computed(() => {
	return data.value ? [data.value] : [];
});

const depth = ref<number>(1);

const { data: egoNetworkData } = useGetEgoNetworkData(
	// @ts-expect-error Includes custom, per-instance system classes.
	computed(() => {
		return {
			id: entity.value == null ? 0 : entity.value.id,
			depth: depth.value,
			exclude_system_classes: project.network.excludeSystemClasses,
		};
	}),
);

useHead({
	title: computed(() => {
		return entity.value?.title ?? t("EntityPage.meta.title");
	}),
	// TODO: description, other metadata
});

const tabs = computed(() => {
	const tabs = [];
	if (
		entity.value?.geometries != null &&
		hasCoordinates(entity.value.geometries as unknown as Geometry)
	) {
		tabs.push({
			id: "geo-map",
			label: t("EntityPage.map"),
		});
	}
	if (images.value != null && images.value.length > 0) {
		tabs.push({
			id: "images",
			label: t("EntityPage.images", { count: images.value.length }),
		});
	}
	if (
		!project.network.excludeSystemClasses.includes(entity.value?.systemClass ?? "") &&
		Object.values(entity.value?.relations ?? {}).filter((rel) => {
			return rel.length > 0;
		}).length > 0
	) {
		tabs.push({
			id: "ego-network",
			label: t("EntityPage.egoNetwork"),
		});
	}
	if (entity.value?.systemClass === "type") {
		tabs.push({
			id: "types",
			label: t("EntityPage.type-distribution"),
		});
	}
	return tabs;
});

const relationsByType = computed(() => {
	return new Map(Object.entries(entity.value?.relations ?? {}));
	// return groupByToMap(entity.value?.relations ?? [], (relation) => {
	// 	// FIXME: This used to use `relationType` (without the prefix)

	// 	return relation.relationSystemClass;
	// });
});

const typesById = computed(() => {
	return keyByToMap(
		entity.value?.types?.filter((type) => {
			return type != null;
		}) ?? [],
		(type) => {
			return type.id;
		},
	);
});

const egoNetworkContainsOrphan = computed(() => {
	const exclude = project.network.excludeSystemClasses;
	const relations = entity.value?.relations ?? {};

	const validRelations = Object.entries(relations).filter(([key, value]) => {
		return !exclude.includes(key) && Array.isArray(value) && value.length > 0;
	});

	return validRelations.length === 0;
});

const datespans = computed(() => {
	const datespans: Array<{ start: string | null; end: string | null }> = [];
	if (entity.value?.when == null) return datespans;
	[entity.value.when].forEach((timespan) => {
		const _start = createDateSpan(timespan.start);
		const _end = createDateSpan(timespan.end);
		const start = isNonEmptyString(_start) ? _start : null;
		const end = isNonEmptyString(_end) ? _end : null;
		if (start == null && end == null) return;
		datespans.push({ start, end });
	});

	return datespans;
});

const images = computed(() => {
	return entity.value?.files?.reduce((acc: Array<Image>, depiction) => {
		if (depiction.url && depiction.license && depiction.publicShareable !== false) {
			acc.push({
				id: depiction.id,
				url: depiction.url,
				license: depiction.license,
				IIIFManifest: `${depiction.IIIFManifest ?? ""}?url=${requestURL.origin}/entity`,
				mimetype: depiction.mimetype,
				title: depiction.title,
			});
		}
		return acc;
	}, []);
});

const features = computed(() => {
	return (
		entities.value
			.map((entity) => {
				const f = createGeoJsonFeature(entity);

				// @ts-expect-error needs to be filtered for display
				if (f.geometry.type === "Feature" && f.geometry.geometry) {
					// @ts-expect-error geometry exists!
					f.geometry = f.geometry.geometry;
				}

				 
				if (!f.geometry) return null;
				if (
					f.geometry.type === "Point" &&
					Array.isArray(f.geometry.coordinates) &&
					f.geometry.coordinates.length === 2 &&
					typeof f.geometry.coordinates[0] === "number" &&
					typeof f.geometry.coordinates[1] === "number"
				) {
					// good
				} else if (
					f.geometry.type === "GeometryCollection" &&
					Array.isArray(f.geometry.geometries)
				) {
					f.geometry.geometries = f.geometry.geometries.filter((g) => {
						return (
							g.type === "Point" &&
							Array.isArray(g.coordinates) &&
							g.coordinates.length === 2 &&
							typeof g.coordinates[0] === "number" &&
							typeof g.coordinates[1] === "number"
						);
					});
				} else {
					return null;
				}

				f.properties.isDisplayed = true;
				f.properties.isIcon = false;
				f.properties.size = 8;

				return f;
			})
			// @ts-expect-error type of f does exist!
			.filter(Boolean) as Array<typeof f>
	); // remove nulls
});

const nonEmptyRelations = computed(() => {
	return Array.from(relationsByType.value.entries()).filter(([_, relations]) => {
		return relations.length > 0;
	});
});

function updateDepth(newDepth: number) {
	depth.value = newDepth;
}

const selectedTab = ref<number | string>("");

watch(
	tabs,
	(newTabs) => {
		if (!selectedTab.value && newTabs.length > 0) {
			if (newTabs[0]?.id === "ego-network" && egoNetworkContainsOrphan.value) return;
			selectedTab.value = newTabs[0]?.id ?? "";
		}
	},
	{ immediate: true },
);
</script>

<template>
	<MainContent class="relative container grid grid-rows-[auto_auto_1fr] gap-4 py-8">
		<template v-if="entity != null">
			<Card>
				<CardHeader>
					<EntitySystemClass :system-class="entity.systemClass" />
					<PageTitle>{{ entity.title }}</PageTitle>
				</CardHeader>
				<CardContent>
					<div class="grid gap-4">
						<EntityTimespans v-if="datespans.length > 0" :datespans="datespans" />
						<EntityDescriptions :descriptions="[entity?.description ?? '']" />
						<!-- Types -->
						<div class="flex flex-row flex-wrap gap-1">
							<TypesPopover
								v-for="type in entity.types"
								:key="type?.id ?? type?.title ?? 'missing'"
								:type="type"
							/>
						</div>
					</div>
				</CardContent>
			</Card>

			<Tabs
				v-if="tabs.length > 0"
				:class="`${tabs[0]?.id === 'ego-network' && egoNetworkContainsOrphan ? '' : 'h-full'}`"
				:model-value="selectedTab"
				@update:model-value="
					(id) => {
						if (id === 'ego-network' && egoNetworkContainsOrphan) {
							return;
						}

						selectedTab = id;
					}
				"
			>
				<TabsList>
					<template v-for="tab of tabs" :key="tab.id">
						<TabsTrigger
							v-if="!(tab.id === 'ego-network' && egoNetworkContainsOrphan)"
							:value="tab.id"
						>
							<span>{{ tab.label }}</span>
						</TabsTrigger>

						<Tooltip v-else>
							<TooltipTrigger as-child>
								<TabsTrigger :value="tab.id" class="cursor-default opacity-30" aria-disabled="true">
									<span>{{ tab.label }}</span>
								</TabsTrigger>
							</TooltipTrigger>
							<TooltipContent> {{ t("EntityPage.egoNetworkOrphan") }} </TooltipContent>
						</Tooltip>
					</template>
				</TabsList>
				<!-- TODO: keep map alive -->
				<TabsContent v-for="tab of tabs" :key="tab.id" :value="tab.id">
					<VisualisationContainer v-slot="{ height, width }" class="h-96 w-full border">
						<EntityDataGraph
							v-if="tab.id === 'ego-network' && height && width && egoNetworkData"
							:network-data="egoNetworkData ?? []"
							:current-depth="depth"
							@change-depth="(val) => updateDepth(val)"
						/>

						<div v-if="width && height && tab.id === 'geo-map'">
							<GeoMap
								:features="toRaw(features)"
								:movements="toRaw(features)"
								:events="toRaw(features)"
								:height="height"
								:width="width"
								:has-polygons="true"
								:show-movements="false"
								:multiple-movements="null"
								:custom-icons="{}"
							/>
							<!-- use toRaw() to unwrap reactive proxy for deck.gl-->
						</div>
						<EntityImages
							v-else-if="tab.id === 'images' && images && images.length > 0"
							:height="height"
							:width="width"
							:images="images"
						/>
						<EntityTypeDistribution
							v-if="tab.id === 'types' && width && height"
							:id="entity.id"
							:height="height"
							:width="width"
						/>
					</VisualisationContainer>
					<div class="relative max-w-full">
						<div
							id="ego-network-legend"
							class="absolute top-auto right-0 left-auto transform-none"
						></div>
					</div>
				</TabsContent>
			</Tabs>

			<Card>
				<CardHeader>
					<CardTitle>{{ t("EntityPage.details") }}</CardTitle>
				</CardHeader>
				<CardContent>
					<dl
						class="grid gap-x-8 gap-y-4 sm:grid-cols-[repeat(auto-fill,minmax(20rem,1fr))] sm:justify-start"
					>
						<div v-for="[relationType, relations] of nonEmptyRelations" :key="relationType">
							<dt class="text-xs font-medium tracking-wider text-muted-foreground uppercase">
								{{ t(`SystemClassNames.${relationType}`) }}
							</dt>
							<dd>
								<ul role="list">
									<li v-for="(relation, index) of relations.slice(0, 10)" :key="index">
										<NavLink
											v-if="relation?.id"
											class="underline decoration-dotted hover:no-underline"
											:href="{
												path: `/visualization/`,
												query: {
													mode: 'table',
													selection: relation.id,
												},
											}"
										>
											{{ relation.title }}
										</NavLink>
										<span v-if="relation?.systemClass === 'type' && typesById.has(relation.id)">
											({{
												typesById
													.get(relation.id)
													?.typeHierarchy?.map((h) => h.label)
													.join(" > ")
											}})
										</span>
									</li>
								</ul>
								<details v-if="relations.length > 10">
									<summary class="cursor-pointer py-1 text-sm text-muted-foreground">
										{{ t("Global.ShowMore") }}
									</summary>
									<ul role="list">
										<li v-for="(relation, index) of relations.slice(10)" :key="index">
											<NavLink
												v-if="relation?.id"
												class="underline decoration-dotted hover:no-underline"
												:href="{
													path: `/visualization/`,
													query: {
														mode: 'table',
														selection: relation.id,
													},
												}"
											>
												{{ relation.title }}
											</NavLink>
											<span v-if="relation?.systemClass === 'type' && typesById.has(relation.id)">
												({{
													typesById
														.get(relation.id)
														?.typeHierarchy?.map((h) => h.label)
														.join(" > ")
												}})
											</span>
										</li>
									</ul>
								</details>
							</dd>
						</div>
					</dl>
				</CardContent>
			</Card>
		</template>

		<template v-else-if="isLoading">
			<Centered class="pointer-events-none opacity-50">
				<LoadingIndicator />
			</Centered>
		</template>
	</MainContent>
</template>
