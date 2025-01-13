<script lang="ts" setup>
defineProps<{
	title: string;
	relations: Array<NonNullable<EntityFeature["relations"]>[0]>;
}>();
const { getUnprefixedId } = useIdPrefix();
</script>

<template v-if="relations?.length">
	<div class="space-x-4 px-4"></div>
	<RelationListEntry
		v-for="relation in relations"
		:key="getUnprefixedId(relation.relationTo ? relation.relationTo : '')"
		:relation="relation"
		:type="title"
	/>
</template>
