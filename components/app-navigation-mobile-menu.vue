<script lang="ts" setup>
import { MenuIcon } from "lucide-vue-next";

import type { NavLinkProps } from "@/components/nav-link.vue";

const props = defineProps<{
	title: string;
	links: Record<string, { href: NavLinkProps["href"]; label: string }>;
}>();

const isSidepanelOpen = ref(false);

function close() {
	isSidepanelOpen.value = false;
}

const filteredLinks = computed(() => {
	const entries = Object.entries(props.links);
	if (project.map.startPage) {
		// Filter out the 'home' link when map is the start page
		return Object.fromEntries(
			entries.filter(([key]) => {
				return key !== "home";
			}),
		);
	}
	return props.links;
});

onMounted(() => {
	window.addEventListener("resize", close, { passive: true });
});

onScopeDispose(() => {
	window.removeEventListener("resize", close);
});
</script>

<template>
	<Sheet v-model:open="isSidepanelOpen">
		<SheetTrigger aria-label="Toggle navigation menu" class="cursor-default">
			<MenuIcon class="mx-3 my-1.5 size-5" />
		</SheetTrigger>
		<SheetContent class="overflow-y-auto">
			<SheetTitle class="sr-only">{{ props.title }}</SheetTitle>
			<ul class="grid py-8" role="list">
				<li v-for="(link, key) of filteredLinks" :key="key">
					<NavLink
						class="flex py-2 font-medium opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
						:href="link.href"
						@click="close"
					>
						{{ link.label }}
					</NavLink>
				</li>
			</ul>
		</SheetContent>
	</Sheet>
</template>
