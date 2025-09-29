<script setup lang="ts">
import type { TocLink } from "@nuxtjs/mdc";

defineProps<{
	entry: TocLink;
}>();
</script>

<template>
	<li>
		<NuxtLink>{{ entry.text }}</NuxtLink>
	</li>
</template>
