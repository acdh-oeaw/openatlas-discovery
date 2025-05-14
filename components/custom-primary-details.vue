<script setup lang="ts">
import type { PresentationViewModel } from "@/types/api";

defineProps<{ entity: PresentationViewModel }>();
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
