<script setup lang="ts">
import type { TocLink } from "@nuxtjs/mdc";

const _props = defineProps<{
	entry: TocLink;
	currentHash?: string;
}>();
</script>

<template>
	<li class="my-1">
		<NavLink
			:href="`#${entry.id}`"
			:external="true"
			class="decoration-dotted underline-offset-4 hover:underline focus-visible:underline"
			:class="currentHash === entry.id ? 'font-bold' : ''"
			>{{ entry.text }}</NavLink
		>
		<ol v-if="entry.children" class="pl-2">
			<TocEntry
				v-for="child in entry.children"
				:key="child.id"
				:entry="child"
				:current-hash="currentHash"
			></TocEntry>
		</ol>
	</li>
</template>
