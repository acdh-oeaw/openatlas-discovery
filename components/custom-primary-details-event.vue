<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";

import type { PresentationViewModel } from "@/types/api";

const t = useTranslations();

const props = defineProps<{ entity: PresentationViewModel }>();
const route = useRoute();

const previousFeature = computed(() => {
	const movement = props.entity.relations?.activity
		?.concat(props.entity.relations.move ?? [])
		.find((rel) => {
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
	const movement = props.entity.relations?.activity
		?.concat(props.entity.relations.move ?? [])
		.find((rel) => {
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
			<ChevronLeftIcon class="size-4 shrink-0" />
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
			<ChevronRightIcon class="size-4 shrink-0" />
		</NavLink>
	</div>
	<GroupedRelationCollapsible
		v-for="(rels, key) in entity.relations"
		:key="`${entity.id} - ${key}`"
		:title="key"
		:relations="(rels ?? []).filter((r) => r != null).filter((r) => r.id != entity.id)"
		:show-on-map="collapsibleRelations[key]?.showOnMap ?? false"
		:entity-id="entity.id"
	/>
</template>
