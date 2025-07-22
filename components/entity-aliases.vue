<script setup lang="ts">
const props = defineProps<{ aliases: Array<string> }>();

const aliasList = computed(() => {
	return props.aliases.join(", ");
});
</script>

<template>
	<CardDescription>
		{{ aliasList }}
	</CardDescription>
</template>
