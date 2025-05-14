<script setup lang="ts">
import type { PresentationViewModel } from "@/types/api";

const t = useTranslations();

const props = defineProps<{ entity: PresentationViewModel }>();

const getRelationGroupTitle = (relation: RelationType) => {
	if (props.entity.systemClass === "person") {
		return useRelationGroupTitle(relation, "person");
	}
	return useRelationGroupTitle(relation);
};

const _collapsibleRelations: Array<{
	relationType: RelationType;
	title: string;
}> = [
	{
		relationType: {
			crmCode: "OA7",
		},
		title: t(getRelationGroupTitle({ crmCode: "OA7" })),
	},
	{
		relationType: {
			crmCode: "P107",
			inverse: true,
		},
		title: t(getRelationGroupTitle({ crmCode: "P107", inverse: true })),
	},
	{
		relationType: {
			crmCode: "P107",
		},
		title: t(getRelationGroupTitle({ crmCode: "P107" })),
	},
];

const handledRelations: Array<RelationType> = [
	{
		crmCode: "P107",
	},
	{
		crmCode: "P74",
	},
	{
		crmCode: "OA7",
	},
	{
		crmCode: "OA8",
	},
	{
		crmCode: "OA9",
	},
];

const emit = defineEmits({
	handledRelations(payload: Array<RelationType>) {
		return payload;
	},
});

onMounted(() => {
	emit("handledRelations", handledRelations);
});
</script>

<template>
	<GroupedRelationCollapsible
		v-for="(rels, key) in entity.relations"
		:key="`${entity.id} - ${key}`"
		:title="key"
		:relations="(rels ?? []).filter((r) => r != null)"
		:show-on-map="false"
	/>
</template>
