<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";

import type { PresentationViewModel } from "@/types/api";

const t = useTranslations();

const props = defineProps<{ entity: PresentationViewModel }>();
const route = useRoute();

const previousFeature = computed(() => {
	const movement = props.entity.relations?.activity?.find((rel) => {
		return rel?.relationTypes?.find((type) => {
			return type?.property === "crm:P134_continued";
		});
	});
	if (movement)
		return {
			id: movement.id,
			"@id": movement.id,
			title: movement.title,
			systemClass: movement.systemClass,
		};
	return null;
});

const nextFeature = computed(() => {
	const movement = props.entity.relations?.activity?.find((rel) => {
		return rel?.relationTypes?.find((type) => {
			return type?.property === "crm:P134i_was_continued_by";
		});
	});
	if (movement)
		return {
			id: movement.id,
			"@id": movement.id,
			title: movement.title,
			systemClass: movement.systemClass,
		};
	return null;
});

const collapsibleRelations: Array<{
	relationType: RelationType;
	systemClass?: string;
	title: string;
}> = [
	{
		relationType: {
			crmCode: "P46",
		},
		systemClass: "artifact",
		title: t("Relations.Artifacts"),
	},
	{
		relationType: {
			crmCode: "P46",
		},
		systemClass: "human_remains",
		title: t("Relations.HumanRemains"),
	},
];

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
</script>

<template>
	<div class="flex justify-between">
		<NavLink
			v-if="previousFeature"
			:href="{
				path: `/${getPath()}`,
				query: { mode: currentMode, selection: previousFeature.id },
			}"
			class="flex items-center underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
		>
			<ChevronLeftIcon class="size-4" />
			<span>{{ previousFeature.title }}</span>
			<span class="sr-only">{{ t("EntitySidebar.PreviousFeature") }}</span>
		</NavLink>
		<NavLink
			v-if="nextFeature"
			:href="{
				path: `/${getPath()}`,
				query: { mode: currentMode, selection: nextFeature.id },
			}"
			class="flex items-center underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
		>
			<span>{{ nextFeature.title }}</span>
			<span class="sr-only">{{ t("EntitySidebar.NextFeature") }}</span>
			<ChevronRightIcon class="size-4" />
		</NavLink>
	</div>
	<GroupedRelationCollapsible
		v-for="rel in collapsibleRelations"
		:key="rel.relationType.crmCode + rel.relationType.inverse"
		:title="rel.title"
		:relations="entity.relations"
		:system-class="rel.systemClass"
		:relation-type="rel.relationType"
		:show-on-map="false"
	/>
</template>
