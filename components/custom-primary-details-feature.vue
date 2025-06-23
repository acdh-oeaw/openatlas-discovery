<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";

import type { PresentationViewModel } from "@/types/api";

const t = useTranslations();

const { getUnprefixedId } = useIdPrefix();

const props = defineProps<{ entity: PresentationViewModel }>();
const route = useRoute();

const { data } = useGetBySystemClass(
	computed(() => {
		return { system_class: "feature" };
	}),
	computed(() => {
		return { show: ["none"], limit: 0 };
	}),
);

const features = computed(() => {
	return (
		data.value?.enities.map((feat) => {
			return feat.features[0];
		}) ?? []
	);
});

const currentFeatureIndex = computed(() => {
	return features.value.findIndex((feature) => {
		return feature?.properties._id === String(props.entity.id);
	});
});

const previousFeature = computed(() => {
	if (currentFeatureIndex.value === 0) {
		return null;
	}
	return features.value[currentFeatureIndex.value - 1];
});

const nextFeature = computed(() => {
	if (currentFeatureIndex.value === features.value.length - 1) {
		return null;
	}
	return features.value[currentFeatureIndex.value + 1];
});

const collapsibleRelations: Record<
	string,
	{
		relationType: RelationType;
		systemClass?: string;
		title: string;
		showOnMap?: boolean;
	}
> = {
	artifact: {
		relationType: {
			crmCode: "P46",
		},
		systemClass: "artifact",
		title: t("Relations.Artifacts"),
	},
	human_remains: {
		relationType: {
			crmCode: "P46",
		},
		systemClass: "human_remains",
		title: t("Relations.HumanRemains"),
	},
};

const emit = defineEmits({
	handledRelations(payload: Array<RelationType>) {
		return payload;
	},
});

const handledRelations: Array<RelationType> = [
	{
		crmCode: "P46",
	},
];

onMounted(() => {
	emit("handledRelations", handledRelations);
});

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

const currentMode = computed(() => {
	return route.query.mode;
});
const { getFilteredRelations } = useGetFilteredRelations();

const filteredRelations = computed(() => {
	return getFilteredRelations(props.entity);
});
</script>

<template>
	<div class="flex justify-between">
		<NavLink
			v-if="previousFeature"
			:href="{
				path: `/${getPath()}`,
				query: { mode: currentMode, selection: getUnprefixedId(previousFeature['@id']) },
			}"
			class="flex items-center underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
		>
			<ChevronLeftIcon class="size-4 shrink-0" />
			<span>{{ previousFeature.properties.title }}</span>
			<span class="sr-only">{{ t("EntitySidebar.PreviousFeature") }}</span>
		</NavLink>
		<NavLink
			v-if="nextFeature"
			:href="{
				path: `/${getPath()}`,
				query: { mode: currentMode, selection: getUnprefixedId(nextFeature['@id']) },
			}"
			class="flex items-center underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
		>
			<span>{{ nextFeature.properties.title }}</span>
			<span class="sr-only">{{ t("EntitySidebar.NextFeature") }}</span>
			<ChevronRightIcon class="size-4 shrink-0" />
		</NavLink>
	</div>
	<GroupedRelationCollapsible
		v-for="[key, rels] in filteredRelations"
		:key="`${entity.id} - ${key}`"
		:title="key"
		:relations="(rels ?? []).filter((r) => r != null).filter((r) => r.id != entity.id)"
		:show-on-map="collapsibleRelations[key]?.showOnMap ?? false"
		:entity="entity"
	/>
</template>
