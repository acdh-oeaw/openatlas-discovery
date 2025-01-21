<script lang="ts" setup>
import * as v from "valibot";
import { useTemplateRef } from "vue";
import type { LocationQueryValue } from "vue-router";
import { z } from "zod";

import { project } from "../config/project.config";
import NetworkControls from "./network-controls.vue";

const router = useRouter();
const route = useRoute();

export interface NetworkSearchData {
	search: string;
	systemClasses: Array<string>;
}

const detailEntityId = computed(() => {
	return route.query.selection as string;
});

const searchFiltersSchema = v.object({
	search: v.fallback(v.string(), ""),
	systemClasses: v.fallback(v.array(v.string()), []),
});

const searchFilters = computed(() => {
	if (route.query.systemClasses) {
		normalizeQuery(route.query.systemClasses);
	}
	return v.parse(searchFiltersSchema, route.query);
});

function normalizeQuery(query: Array<LocationQueryValue> | string) {
	if (Array.isArray(query)) {
		return;
	} else {
		if (route.query.ssystemClasses) {
			route.query.systemClasses = [query];
		}
	}
}
function onChangeSearchFilters(values: NetworkSearchData) {
	const query = { mode: route.query.mode, ...searchFilters.value, ...values };

	if (searchFilters.value.search === "") {
		// @ts-expect-error Fix me later please
		delete query.search;
	}

	void router.push({ query });
}

const { data, isPending, isPlaceholderData } = useGetNetworkData(
	// @ts-expect-error Includes custom, per-instance system classes.
	computed(() => {
		return {
			// TO-DO: Currently there is an issue: filtering by case study and system_class type will return no results
			exclude_system_classes: project.network.excludeSystemClasses,
		};
	}),
);

const dataGraph = useTemplateRef("dataGraph");

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entities = computed(() => {
	return data.value?.results.flatMap((result) => {
		return result;
	}) ?? [];
});

const systemClasses = computed(() => {
	const systemClasses: Array<string> = [];

	entities.value.forEach((entity) => {
		if (!systemClasses.includes(entity.systemClass)) {
			systemClasses.push(entity.systemClass);
		}
	});

	return systemClasses;
});

function emitControls(args: string) {
	if (args === "fullscreen") {
		let elem = document.getElementById("network-container");

		if (!document.fullscreenElement && elem != null) {
			elem.classList.add("bg-white", "dark:bg-black");
			elem.requestFullscreen().catch(() => {
				console.log(`Error attempting to enable fullscreen mode`);
			});
			isFullscreen.value = true;
		} else {
			void document.exitFullscreen();
			elem?.classList.remove("bg-white", "dark:bg-black");
			isFullscreen.value = false;
		}
	}
	if (dataGraph.value != null) {
		dataGraph.value.emitNetworkControls(args);
	}
}

const isFullscreen = ref(false);
</script>

<template>
	<div
		id="network-container"
		:class="project.fullscreen ? 'relative grid' : 'relative grid grid-rows-[auto_1fr] gap-4'"
	>
		<div :class="project.fullscreen ? 'absolute z-10 flex w-full justify-center' : ''">
			<NetworkSearchForm
				:class="
					project.fullscreen
						? 'absolute z-10 bg-white/90 dark:bg-neutral-900 max-w-[800px] w-full m-3 rounded-md p-6 shadow-md'
						: ''
				"
				:search="searchFilters.search"
				@submit="onChangeSearchFilters"
			/>
		</div>

		<VisualisationContainer
			v-slot="{ height, width }"
			class="border"
			:class="{ 'opacity-50 grayscale': isLoading }"
		>
			<div class="absolute bottom-0 right-0 z-10">
				<NetworkControls
					class="right-0 m-3 ml-auto bg-white/90"
					:layout-running="dataGraph?.layoutIsRunning"
					:is-fullscreen="isFullscreen"
					@network-control-event="(args) => emitControls(args)"
				/>
				<NetworkLegendPanel
					v-if="height && width"
					class="m-3 bg-white/90"
					:system-classes="systemClasses"
					:search-filters="searchFilters.systemClasses"
					@submit="onChangeSearchFilters"
				/>
			</div>
			<DataGraph
				ref="dataGraph"
				:network-data="entities"
				:search-node="searchFilters.search"
				:detail-node="detailEntityId"
			/>
			<Centered v-if="isLoading" class="pointer-events-none">
				<LoadingIndicator class="text-neutral-950" size="lg" />
			</Centered>
		</VisualisationContainer>
	</div>
</template>
