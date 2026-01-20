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
		<SheetContent class="max-h-full min-h-0 overflow-y-auto" :backdrop="true">
			<SheetTitle class="sr-only">{{ props.title }}</SheetTitle>
			<div class="grid h-full grid-rows-[auto_1fr] items-end">
				<ul class="grid overflow-auto py-8" role="list">
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
				<div class="flex justify-start">
					<AppFooter @close="close" />
				</div>
			</div>
		</SheetContent>
	</Sheet>
</template>
