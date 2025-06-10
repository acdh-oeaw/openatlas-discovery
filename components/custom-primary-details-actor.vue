<script setup lang="ts">
import type { PresentationViewModel } from "@/types/api";

const props = defineProps<{ entity: PresentationViewModel }>();

const { getFilteredRelations } = useGetFilteredRelations();

const filteredRelations = computed(() => {
	return getFilteredRelations(props.entity);
});

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
		v-for="[key, rels] in filteredRelations"
		:key="`${entity.id} - ${key}`"
		:title="key"
		:relations="(rels ?? []).filter((r) => r != null)"
		:show-on-map="false"
		:entity="entity"
	/>
</template>
