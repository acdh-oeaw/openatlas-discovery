<script lang="ts" setup>
import { MapPinIcon, RadiusIcon, TablePropertiesIcon } from "lucide-vue-next";
import { useTemplateRef } from "vue";

import EntitySidebar from "@/components/entity-sidebar.vue";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

const sidebar = useTemplateRef<typeof EntitySidebar>("sidebar");
const sidebarOpen = computed(() => {
	return sidebar.value?.openState;
});
</script>

<template>
	<NuxtLayout name="default">
		<div class="absolute right-4 z-20" style="top: calc(50% - 110px)">
			<ModeSwitch v-if="id != null" :id="id" :current-mode="currentMode" />
			<div v-else>
				<div class="grid gap-2 rounded-md bg-white/90 p-4 shadow-md dark:bg-black/90">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<div
									:class="
										currentMode === 'map'
											? 'rounded-md bg-brand p-4 shadow-md'
											: 'rounded-md bg-primary/90 p-4 shadow-md dark:bg-white'
									"
								>
									<NavLink
										class="flex items-center gap-1 underline decoration-dotted hover:no-underline"
										:href="{
											path: `/${getPath()}`,
											query: {
												mode: 'map',
											},
										}"
									>
										<MapPinIcon class="size-6 text-white dark:text-black" />
									</NavLink>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{{ t("EntityPage.map") }}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<div
									:class="
										currentMode === 'network'
											? 'rounded-md bg-brand p-4 shadow-md'
											: 'rounded-md bg-primary/90 p-4 shadow-md dark:bg-white'
									"
								>
									<NavLink
										class="flex items-center gap-1 underline decoration-dotted hover:no-underline"
										:href="{
											path: `/${getPath()}`,
											query: {
												mode: 'network',
											},
										}"
									>
										<RadiusIcon class="size-6 text-white dark:text-black" />
									</NavLink>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{{ t("EntityPage.network") }}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<div
									:class="
										currentMode === 'table'
											? 'rounded-md bg-brand p-4 shadow-md'
											: 'rounded-md bg-primary/90 p-4 shadow-md dark:bg-white'
									"
								>
									<NavLink
										class="flex items-center gap-1 underline decoration-dotted hover:no-underline"
										:href="{
											path: `/${getPath()}`,
											query: {
												mode: 'table',
											},
										}"
									>
										<TablePropertiesIcon class="size-6 text-white dark:text-black" />
									</NavLink>
								</div>
							</TooltipTrigger>
							<TooltipContent>
								<p>{{ t("DataPage.title") }}</p>
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
			</div>
		</div>
		<MainContent class="relative h-full">
			<template v-if="id != null && currentMode !== 'table'">
				<EntitySidebar :id="id" :no-table-sidebar="true" />
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
