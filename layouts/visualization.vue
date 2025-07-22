<script lang="ts" setup>
import { useTemplateRef } from "vue";

import EntitySidebar from "@/components/entity-sidebar.vue";

const t = useTranslations();

const route = useRoute();

usePageMetadata({
	title: t("EntityPage.meta.title"),
});

const id = computed(() => {
	if (route.query.selection != null) {
		return Number(route.query.selection);
	} else return null;
});

const currentMode = computed(() => {
	return route.query.mode as string;
});

const sidebar = useTemplateRef<typeof EntitySidebar>("sidebar");
const sidebarOpen = computed(() => {
	return sidebar.value?.openState;
});
</script>

<template>
	<NuxtLayout name="default">
		<MainContent class="relative h-full">
			<template v-if="id != null && currentMode !== 'table'">
				<EntitySidebar :id="id" :no-table-sidebar="true" :mode="currentMode" />
			</template>
			<div
				class="relative grid h-full grid-cols-[0px_1fr] transition-all delay-150 ease-in-out data-[sidepanel]:grid-cols-[25vw_1fr]"
				:data-sidepanel="id != null && currentMode === 'table' ? 'true' : undefined"
			>
				<div class="grid h-full" :class="{ 'z-10': sidebarOpen }">
					<EntitySidebar
						v-if="id != null && currentMode === 'table'"
						:id="id"
						ref="sidebar"
						:mode="currentMode"
						:no-table-sidebar="false"
					/>
				</div>
				<slot v-if="currentMode != 'table'" />
				<div
					v-else
					class="transition-all delay-0"
					:class="{ 'ml-[calc(-25vw+1.5rem)]': id != null && !sidebarOpen }"
				>
					<slot></slot>
				</div>
			</div>
		</MainContent>
	</NuxtLayout>
</template>
