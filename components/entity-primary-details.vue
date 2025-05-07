<script setup lang="ts">
import { CheckIcon, CopyIcon } from "lucide-vue-next";

import CustomPrimaryDetailsActor from "@/components/custom-primary-details-actor.vue";
import CustomPrimaryDetailsEvent from "@/components/custom-primary-details-event.vue";
import CustomPrimaryDetailsFeature from "@/components/custom-primary-details-feature.vue";
import CustomPrimaryDetailsPlace from "@/components/custom-primary-details-place.vue";
import { project } from "@/config/project.config";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRelationTitle = (relation: RelationType) => {
	return useRelationTitle(relation, props.entity.systemClass);
};

const { getUnprefixedId } = useIdPrefix();
const route = useRoute();
const t = useTranslations();

const props = defineProps<{
	entity: EntityFeature;
}>();

interface Image {
	IIIFManifest: string | undefined;
	license: string | undefined;
	mimetype?: string | undefined;
	title?: string | undefined;
	url?: string | undefined;
	publicShareable?: boolean | undefined;
}

const images = computed(() => {
	return props.entity.depictions?.reduce((acc: Array<Image>, depiction) => {
		if (depiction.url && depiction.license && depiction.publicShareable) {
			acc.push({
				url: depiction.url,
				license: depiction.license,
				IIIFManifest: depiction.IIIFManifest,
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
	return entityPrimaryDetailsDict[props.entity.systemClass];
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
			id: parseInt(props.entity.properties._id),
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

const isCopied = ref(false);

// TODO: For instances where there is no location set (at least for actors), make use of first and last event if no places are available
const places = computed(() => {
	return props.entity.relations.reduce((acc: Array<Place>, relation) => {
		if (relation.relationSystemClass !== "object_location") return acc;
		if (!relation.label || !relation.relationTo || !relation.relationType) return acc;
		const id = getUnprefixedId(relation.relationTo);
		const relationType = extractRelationTypeFromRelationString(relation.relationType);
		const label = relation.label;
		if (!id) return acc;
		return [
			...acc,
			{
				label,
				id,
				relationType,
			},
		];
	}, []);
});

watchEffect(() => {
	if (route.query.selection) {
		isCopied.value = false;
	}
	// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
	if (!places.value || places.value.length === 0) return;
	const relTypes = places.value.map((place) => {
		return place.relationType;
	});
	for (const type of relTypes) {
		if (type) handledRelations.add(type);
	}
	emitHandledRelations([]);
});

function copyEntity() {
	const fullUrl = window.location.href;
	const baseUrl = fullUrl.split(route.path)[0];
	if (baseUrl) {
		isCopied.value = true;
		return navigator.clipboard.writeText(`${baseUrl}/entity/${route.query.selection as string}`);
	}
	return null;
}

const tabs = computed(() => {
	const tabs = [];
	if (images.value != null) {
		tabs.push({
			id: "images",
			label: t("EntityPage.images", { count: images.value.length }),
		});
	}
	if (props.entity.relations.length > 0) {
		tabs.push({
			id: "ego-network",
			label: t("EntityPage.network"),
		});
	}
	return tabs;
});

const filteredTypes = computed(() => {
	return props.entity.types?.filter((type) => {
		if (!type.identifier) return true;
		const unprefixedId = getUnprefixedId(type.identifier);
		return (
			!project.detailView.excludeTypeIds.includes(Number(unprefixedId)) &&
			type.typeHierarchy?.every((hierarchyType) => {
				return (
					!hierarchyType.identifier ||
					!project.detailView.excludeTypeIds.includes(
						Number(getUnprefixedId(hierarchyType.identifier)),
					)
				);
			})
		);
	});
});
</script>

<template>
	<div class="grid grid-cols-1 md:grid-cols-[auto_auto]">
		<EntitySystemClass :system-class="entity.systemClass" />
		<div v-if="!isCopied" class="ml-auto">
			<Button variant="outline" @click="copyEntity">
				<CopyIcon :size="16" />
				{{ t("EntitySidebar.copy") }}
			</Button>
		</div>
		<div v-if="isCopied" class="ml-auto">
			<Button variant="brand" @click="copyEntity">
				<CheckIcon :size="16" />
				{{ t("EntitySidebar.copied") }}
			</Button>
		</div>
	</div>
	<PageTitle>{{ entity.properties.title }}</PageTitle>
	<!-- @ts-expect FIXME: Incorrect information provided by openapi document. -->
	<EntityAliases
		v-if="entity.names"
		:aliases="entity.names as unknown as Array<{ alias: string }>"
	/>
	<EntityTimespans :timespans="entity.when?.timespans" />
	<div class="grid gap-4">
		<EntityDescriptions :descriptions="entity?.descriptions ?? []" />

		<!-- Types -->
		<div class="flex flex-row flex-wrap gap-1">
			<TypesPopover
				v-for="type in filteredTypes"
				:key="type.identifier ?? type.label ?? 'missing'"
				:type="type"
			/>
		</div>

		<Tabs v-if="tabs.length > 0" :default-value="tabs[0]?.id">
			<TabsList>
				<TabsTrigger v-for="tab of tabs" :key="tab.id" :value="tab.id">
					{{ tab.label }}
				</TabsTrigger>
			</TabsList>
			<!-- TODO: keep map alive -->
			<TabsContent v-for="tab of tabs" :key="tab.id" :value="tab.id">
				<div class="relative max-w-full">
					<VisualisationContainer
						id="ego-network"
						v-slot="{ height, width }"
						class="aspect-video w-full border"
					>
						<EntityDataGraph
							v-if="tab.id === 'ego-network' && height && width && egoNetworkData"
							:network-data="egoNetworkData ?? []"
						/>

						<EntityImages
							v-if="tab.id === 'images' && images"
							class="overflow-hidden"
							:images="images"
						/>
					</VisualisationContainer>
					<div class="relative max-w-full">
						<div
							id="ego-network-legend"
							class="absolute left-auto right-0 top-auto transform-none"
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
</template>
