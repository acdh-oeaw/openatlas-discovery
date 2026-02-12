<script setup lang="ts">
import { isNonEmptyString } from "@acdh-oeaw/lib";

import CustomPrimaryDetails from "@/components/custom-primary-details.vue";
import CustomPrimaryDetailsActor from "@/components/custom-primary-details-actor.vue";
import CustomPrimaryDetailsEvent from "@/components/custom-primary-details-event.vue";
import CustomPrimaryDetailsFeature from "@/components/custom-primary-details-feature.vue";
import CustomPrimaryDetailsPlace from "@/components/custom-primary-details-place.vue";
import { project } from "@/config/project.config";
import type { PresentationViewModel, TypeTreeModel } from "@/types/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRelationTitle = (relation: RelationType) => {
	return useRelationTitle(relation, props.entity.systemClass);
};

const { getUnprefixedId } = useIdPrefix();
const requestURL = useRequestURL();
const t = useTranslations();

const props = defineProps<{
	entity: PresentationViewModel;
}>();

export interface Image {
	id: number;
	IIIFManifest: string | undefined;
	license: string | undefined;
	mimetype?: string | undefined;
	title?: string | undefined;
	url?: string | undefined;
	publicShareable?: boolean | undefined;
}

const depth = ref<number>(1);

const images = computed(() => {
	return props.entity.files?.reduce((acc: Array<Image>, depiction) => {
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

const customPrimaryDetails = computed(() => {
	if (props.entity.viewClass in entityPrimaryDetailsDictByViewClass)
		return entityPrimaryDetailsDictByViewClass[props.entity.viewClass];
	return entityPrimaryDetailsDict[props.entity.systemClass] ?? CustomPrimaryDetails;
});

const entityPrimaryDetailsDictByViewClass: Record<string, Component> = {
	event: CustomPrimaryDetailsEvent,
};

const entityPrimaryDetailsDict: Record<string, Component> = {
	person: CustomPrimaryDetailsActor,
	group: CustomPrimaryDetailsActor,
	place: CustomPrimaryDetailsPlace,
	stratigraphic_unit: CustomPrimaryDetailsPlace,
	feature: CustomPrimaryDetailsFeature,
};

const handledRelations = new Set<RelationType>([
	{
		crmCode: "P1", // "is identified by" are the aliases
	},
	{
		crmCode: "P2", // "has type" are the types
	},
]);

const emit = defineEmits({
	handledRelations(payload: Array<RelationType>) {
		return payload;
	},
});

const { data: egoNetworkData } = useGetEgoNetworkData(
	// @ts-expect-error Includes custom, per-instance system classes.
	computed(() => {
		return {
			id: props.entity.id,
			depth: depth.value,
			exclude_system_classes: project.network.excludeSystemClasses,
		};
	}),
);

let alreadyEmitted = false;

onMounted(() => {
	if (!alreadyEmitted) emitHandledRelations([]);
});

function emitHandledRelations(relations: Array<RelationType>) {
	alreadyEmitted = true;
	for (const relation of relations) handledRelations.add(relation);
	emit("handledRelations", [...handledRelations]);
}

interface Place {
	label: string;
	id: string;
	relationType: RelationType | null;
}

// TODO: For instances where there is no location set (at least for actors), make use of first and last event if no places are available
const places = computed(() => {
	return props.entity.relations?.place?.reduce((acc: Array<Place>, relatedPlace) => {
		if (relatedPlace?.systemClass !== "object_location") return acc;
		if (!relatedPlace.title || !relatedPlace.id || !relatedPlace.relationTypes) return acc;
		if (!relatedPlace.id) return acc;
		const id = String(relatedPlace.id);

		const label = relatedPlace.title;
		const arrayOfRelations = relatedPlace.relationTypes.map((type) => {
			const relationType = extractRelationTypeFromRelationString(type?.property);
			return {
				label,
				id,
				relationType,
			};
		});
		return [...acc, ...arrayOfRelations];
	}, []);
});

watch(
	() => {
		return places.value;
	},
	(newPlaces) => {
		if (!newPlaces || newPlaces.length === 0) return;

		const relTypes = newPlaces.map((place) => {
			return place.relationType;
		});

		for (const type of relTypes) {
			if (type) handledRelations.add(type);
		}

		emitHandledRelations([]);
	},
	{ immediate: true },
);

const egoNetworkContainsOrphan = ref(true);

const tabs = computed(() => {
	const tabs = [];
	if (images.value != null && images.value.length > 0) {
		tabs.push({
			id: "images",
			label: t("EntityPage.images", { count: images.value.length }),
		});
	}
	if (
		!project.network.excludeSystemClasses.includes(props.entity.systemClass) &&
		Object.values(props.entity.relations ?? {}).filter((rel) => {
			return rel.length > 0;
		}).length > 0
	) {
		tabs.push({
			id: "ego-network",
			label: t("EntityPage.egoNetwork"),
		});
	}
	if (props.entity.systemClass === "type") {
		tabs.push({
			id: "types",
			label: t("EntityPage.type-distribution"),
		});
	}
	return tabs;
});

const detailViewConfig = computed(() => {
	return (
		project.detailView.find((config) => {
			return config.affectedSystemClasses?.includes(props.entity.systemClass);
		}) ??
		project.detailView.find((config) => {
			return !config.affectedSystemClasses?.length;
		})
	);
});

const filteredTypes = computed(() => {
	return props.entity.types
		?.filter((type) => {
			if (type == null) return false;
			if (!type.id) return true;
			const unprefixedId = type.id;
			return (
				!detailViewConfig.value?.excludeTypeIds?.includes(Number(unprefixedId)) &&
				type.typeHierarchy?.every((hierarchyType) => {
					return (
						!hierarchyType.identifier ||
						!detailViewConfig.value?.excludeTypeIds?.includes(
							Number(getUnprefixedId(hierarchyType.identifier)),
						)
					);
				})
			);
		})
		.filter((type) => {
			return type != null;
		});
});

const { data: typeData } = useGetTypeDistribution();
const typeTree = computed(() => {
	if (!typeData.value) return {} as TypeTreeModel["typeTree"];
	return typeData.value.typeTree;
});

const superTypes: typeof filteredTypes = computed(() => {
	const currentType = typeTree.value[String(props.entity.id) as keyof TypeTreeModel["typeTree"]];

	if (!currentType) return [];
	const hierarchy = currentType.root.map((entry) => {
		return typeTree.value[String(entry) as keyof TypeTreeModel["typeTree"]];
	});
	const directParent = hierarchy.pop();
	if (!directParent) return [];
	const result = [
		{
			...directParent,
			id: directParent.id,
			isStandard: directParent.category === "standard",
			title: directParent.name,
			typeHierarchy: hierarchy.map((e) => {
				return { ...e, identifier: String(e.id), label: e.name };
			}),
		},
	];
	return result;
});

function updateDepth(newDepth: number) {
	depth.value = newDepth;
}

const isEmptyPrimaryDetails = computed(() => {
	return (
		(images.value?.length ?? 0) === 0 &&
		(props.entity.types?.length ?? 0) === 0 &&
		!props.entity.description &&
		Object.values(props.entity.relations ?? {}).every((rel) => {
			return rel.length === 0;
		})
	);
});
const isEmptyFurtherInformation = computed(() => {
	return (
		(props.entity.externalReferenceSystems?.length ?? 0) === 0 &&
		(props.entity.files?.length ?? 0) === 0
	);
});
const isType = computed(() => {
	return props.entity.systemClass === "type";
});

const datespans = computed(() => {
	const datespans: Array<{ start: string | null; end: string | null }> = [];
	if (props.entity.when == null) return datespans;
	[props.entity.when].forEach((timespan) => {
		const _start = createDateSpan(timespan.start);
		const _end = createDateSpan(timespan.end);
		const start = isNonEmptyString(_start) ? _start : null;
		const end = isNonEmptyString(_end) ? _end : null;
		if (start == null && end == null) return;
		datespans.push({ start, end });
	});

	return datespans;
});

const selectedTab = ref<number | string>("");

watch(
	() => {
		return props.entity;
	},
	() => {
		if (props.entity.relations) {
			const exclude = project.network.excludeSystemClasses;
			const relations = props.entity.relations ?? {};
			egoNetworkContainsOrphan.value =
				Object.entries(relations).filter(([key, value]) => {
					return !exclude.includes(key) && Array.isArray(value) && value.length > 0;
				}).length === 0;
		}

		if (
			tabs.value[0]?.id == null ||
			(tabs.value[0]?.id === "ego-network" && egoNetworkContainsOrphan.value)
		) {
			selectedTab.value = "";
			return;
		}
		selectedTab.value = tabs.value[0]?.id ?? "";
	},
	{ immediate: true, flush: "post" },
);

onMounted(async () => {
	await nextTick();
	if (tabs.value[0]?.id === "ego-network" && egoNetworkContainsOrphan.value) {
		return;
	}
	selectedTab.value = tabs.value[0]?.id ?? "";
});
</script>

<template>
	<EntitySystemClass :system-class="entity.systemClass" />
	<PageTitle class="mb-0">{{ entity.title }}</PageTitle>

	<EntityBreadcrumbs :entity="entity" class="mb-5"></EntityBreadcrumbs>
	<!-- @ts-expect FIXME: Incorrect information provided by openapi document. -->
	<EntityAliases v-if="entity.aliases" :aliases="entity.aliases as unknown as Array<string>" />
	<EntityTimespans v-if="datespans.length > 0" :datespans="datespans" class="my-5" />

	<div
		v-if="isEmptyPrimaryDetails && isEmptyFurtherInformation && !isType"
		class="text-neutral-400 italic"
	>
		{{ t("EntityPage.no-details") }}
	</div>
	<div v-else-if="!isEmptyPrimaryDetails || isType" class="relative flex max-w-full flex-col gap-4">
		<EntityDescriptions v-if="entity.description" :descriptions="[entity?.description ?? '']" />

		<!-- Types -->
		<div class="flex flex-row flex-wrap gap-1">
			<TypesPopover
				v-for="type in isType ? superTypes : filteredTypes"
				:key="type.id ?? type.title ?? 'missing'"
				:type="type"
			/>
		</div>

		<Tabs
			v-if="tabs.length > 0"
			:class="`${tabs[0]?.id === 'ego-network' && egoNetworkContainsOrphan ? '' : 'max-h-96'}`"
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
				<div class="relative w-full">
					<VisualisationContainer
						id="ego-network"
						v-slot="{ height, width }"
						class="aspect-video w-full border"
					>
						<EntityDataGraph
							v-if="tab.id === 'ego-network' && height && width && egoNetworkData"
							:network-data="egoNetworkData ?? []"
							:current-depth="depth"
							:entity-id="String(props.entity.id)"
							@change-depth="(val) => updateDepth(val)"
						/>

						<EntityImages
							v-if="tab.id === 'images' && images && images.length > 0"
							class="overflow-hidden"
							:images="images"
							:height="height"
							:width="width"
						/>

						<EntityTypeDistribution
							v-if="tab.id === 'types' && width && height"
							:id="props.entity.id"
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
				</div>
			</TabsContent>
		</Tabs>

		<component
			:is="customPrimaryDetails"
			v-if="customPrimaryDetails"
			class="pt-2"
			:entity="entity"
			@handled-relations="emitHandledRelations"
		/>
	</div>
	<Separator v-if="!isEmptyPrimaryDetails && !isEmptyFurtherInformation"></Separator>
</template>
