<script setup lang="ts">
import { CheckIcon, CopyIcon } from "lucide-vue-next";

import CustomPrimaryDetails from "@/components/custom-primary-details.vue";
import CustomPrimaryDetailsActor from "@/components/custom-primary-details-actor.vue";
import CustomPrimaryDetailsEvent from "@/components/custom-primary-details-event.vue";
import CustomPrimaryDetailsFeature from "@/components/custom-primary-details-feature.vue";
import CustomPrimaryDetailsPlace from "@/components/custom-primary-details-place.vue";
import { project } from "@/config/project.config";
import type { PresentationViewModel } from "@/types/api";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const getRelationTitle = (relation: RelationType) => {
	return useRelationTitle(relation, props.entity.systemClass);
};

const { getUnprefixedId } = useIdPrefix();
const route = useRoute();
const t = useTranslations();

const props = defineProps<{
	entity: PresentationViewModel;
}>();

interface Image {
	IIIFManifest: string | undefined;
	license: string | undefined;
	mimetype?: string | undefined;
	title?: string | undefined;
	url?: string | undefined;
}

const images = computed(() => {
	return props.entity.files?.reduce((acc: Array<Image>, depiction) => {
		if (depiction.url && depiction.license) {
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
	console.log(props.entity);
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

watchEffect(() => {
	if (route.query.selection) {
		isCopied.value = false;
	}

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

const filteredTypes = computed(() => {
	return props.entity.types
		?.filter((type) => {
			if (type == null) return false;
			if (!type.id) return true;
			const unprefixedId = type.id;
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
		})
		.filter((type) => {
			return type != null;
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
	<PageTitle>{{ entity.title }}</PageTitle>
	<!-- @ts-expect FIXME: Incorrect information provided by openapi document. -->
	<EntityAliases v-if="entity.aliases" :aliases="entity.aliases as unknown as Array<string>" />
	<EntityTimespans v-if="entity.when" :timespans="[entity.when]" />
	<div class="grid gap-4">
		<EntityDescriptions :descriptions="[entity?.description ?? '']" />

		<!-- Types -->
		<div class="flex flex-row flex-wrap gap-1">
			<TypesPopover
				v-for="type in filteredTypes"
				:key="type.id ?? type.title ?? 'missing'"
				:type="type"
			/>
		</div>

		<EntityImages v-if="images" :images="images" class="overflow-hidden" />

		<component
			:is="customPrimaryDetails"
			v-if="customPrimaryDetails"
			:entity="entity"
			@handled-relations="emitHandledRelations"
		/>
	</div>
</template>
