<script setup lang="ts">
import { project } from "@/config/project.config";
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

const props = defineProps<{ entity: PresentationViewModel }>();

const systemClasses = project.detailView.primarySystemClasses;

const filteredRelations = computed(() => {
	const res: Record<string, Array<RelatedEntityModel>> = {};
	for (const relation in props.entity.relations) {
		if (systemClasses.includes(relation))
			res[relation] = props.entity.relations[relation as keyof PresentationViewModel["relations"]];
	}
	for (const otherKey in props.entity) {
		if (systemClasses.includes(otherKey))
			res[otherKey] = props.entity[
				otherKey as keyof PresentationViewModel
			] as Array<RelatedEntityModel>;
	}
	return res;
});
</script>

<template>
	<GroupedRelationCollapsible
		v-for="(rels, key) in filteredRelations"
		:key="`${entity.id} - ${key}`"
		:title="key"
		:relations="(rels ?? []).filter((r) => r != null)"
		:show-on-map="false"
		:entity-id="entity.id"
	/>
</template>
