<script lang="ts" setup>
import type { RelatedEntityModel } from "@/types/api";

const props = defineProps<{
	title: string;
	relations: Array<NonNullable<RelatedEntityModel>>;
	showIcon: boolean;
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
	<RelationListEntry
		v-for="relation in relations"
		:key="relation.id ?? ''"
		:relation="relation"
		:type="title"
		:show-icon="showIcon"
	/>
</template>
