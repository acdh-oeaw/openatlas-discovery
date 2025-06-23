<script lang="ts" setup>
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

const props = defineProps<{
	title: string;
	relations: Array<NonNullable<RelatedEntityModel>>;
	showIcon: boolean;
	entity: PresentationViewModel;
}>();

const _sortedRelations = computed(() => {
	function hasCenter(geometry: NonNullable<RelatedEntityModel>["geometries"]) {
		if (geometry?.type === "FeatureCollection") {
			return Boolean(
				geometry.features.find((g) => {
					return g.geometry?.type === "Point";
				}),
			);
		}
		if (geometry?.geometry?.type === "Point") return true; //geometry.shapeType === "centerpoint";
		return false;
	}
	return props.relations.toSorted((b, a) => {
		return Number(hasCenter(a.geometries)) - Number(hasCenter(b.geometries));
	});
});
</script>

<template v-if="relations?.length">
	<div class="space-x-4 px-4"></div>
	<template v-for="(relation, idx) in props.relations" :key="relation.id ?? ''">
		<RelationListEntry :relation="relation" :type="title" :show-icon="showIcon" :entity="entity" />
		<div v-if="idx < props.relations.length - 1" class="border-separate border-[0.5px]" />
	</template>
</template>
