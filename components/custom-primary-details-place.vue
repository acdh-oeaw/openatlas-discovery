<script setup lang="ts">
import type { PresentationViewModel } from "@/types/api";

const t = useTranslations();

const _props = defineProps<{ entity: PresentationViewModel }>();

const collapsibleRelations: Record<
	string,
	{
		relationType: RelationType;
		systemClass: string;
		title: string;
		fullWidth: boolean;
		showOnMap: boolean;
	}
> = {
	feature: {
		relationType: {
			crmCode: "P46",
		},
		systemClass: "feature",
		title: t("Relations.Features"),
		fullWidth: true,
		showOnMap: true,
	},
	artifact: {
		relationType: {
			crmCode: "P46",
		},
		systemClass: "artifact",
		title: t("Relations.Artifacts"),
		fullWidth: false,
		showOnMap: false,
	},
	human_remains: {
		relationType: {
			crmCode: "P46",
		},
		systemClass: "human_remains",
		title: t("Relations.HumanRemains"),
		fullWidth: false,
		showOnMap: false,
	},
	source: {
		relationType: {
			crmCode: "P67",
			inverse: true,
		},
		systemClass: "source",
		title: t("Relations.Sources"),
		fullWidth: true,
		showOnMap: false,
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
</script>

<template>
	<div v-if="entity.relations != null" class="flex w-full flex-col gap-4">
		<GroupedRelationCollapsible
			v-for="[key, rels] in Object.entries(entity.relations).filter(
				([key, _]) =>
					collapsibleRelations[key]?.fullWidth || collapsibleRelations[key]?.fullWidth == null,
			)"
			:key="`${entity.id} - ${key}`"
			:title="key"
			:relations="(rels ?? []).filter((r) => r != null).filter((r) => r.id != entity.id)"
			:show-on-map="collapsibleRelations[key]?.showOnMap ?? false"
			:entity-id="entity.id"
		/>
	</div>
	<div v-if="entity.relations != null" class="flex w-full gap-4">
		<GroupedRelationCollapsible
			v-for="[key, rels] in Object.entries(entity.relations).filter(
				([key, _]) => collapsibleRelations[key]?.fullWidth === false,
			)"
			:key="`${entity.id} - ${key}`"
			:title="key"
			:relations="(rels ?? []).filter((r) => r != null).filter((r) => r.id != entity.id)"
			:show-on-map="collapsibleRelations[key]?.showOnMap ?? false"
			:entity-id="entity.id"
		/>
	</div>
</template>
