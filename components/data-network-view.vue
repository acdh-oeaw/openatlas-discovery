<script lang="ts" setup>
import * as v from "valibot";
import { useTemplateRef } from "vue";
import type { LocationQueryValue } from "vue-router";

import { project } from "../config/project.config";
import type DataGraph from "./data-graph.vue";
import NetworkControls from "./network-controls.vue";

const router = useRouter();
const route = useRoute();

export interface NetworkSearchData {
	search?: string;
	excludeSystemClasses?: Array<string>;
}

const detailEntityId = computed(() => {
	return route.query.selection as string;
});

const searchFiltersSchema = v.object({
	search: v.fallback(v.string(), ""),
	systemClasses: v.fallback(v.array(v.string()), []),
	excludeSystemClasses: v.fallback(
		v.pipe(
			v.any(),
			v.transform((value: Array<string> | string) => {
				return Array.isArray(value) ? value : [value];
			}), // Single transform to array
			v.array(v.string()), // Validate as string array
		),
		[], // Default value
	),
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
			exclude_system_classes: project.network.excludeSystemClasses.concat(
				searchFilters.value.excludeSystemClasses,
			),
		};
	}),
);

const { data: allSystemClasses } = useGetSystemClassCount();
const relevantSystemClasses = computed(() => {
	if (!allSystemClasses.value) return [];
	return Object.entries(allSystemClasses.value)
		.filter(([key, value]) => {
			return value > 0 && !project.network.excludeSystemClasses.includes(key);
		})
		.map(([key, _]) => {
			return key;
		});
});

const dataGraph = useTemplateRef<typeof DataGraph>("dataGraph");

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entities = computed(() => {
	return (
		data.value?.results.flatMap((result) => {
			return result;
		}) ?? []
	);
});

const showOrphans = ref(false);
function emitControls(args: string) {
	if (args === "fullscreen") {
		let elem = document.getElementById("network-container");

		if (!document.fullscreenElement && elem != null) {
			elem.classList.add("bg-white", "dark:bg-black");
			elem.requestFullscreen().catch(() => {
				console.warn(`Error attempting to enable fullscreen mode`);
			});
			isFullscreen.value = true;
		} else {
			void document.exitFullscreen();
			elem?.classList.remove("bg-white", "dark:bg-black");
			isFullscreen.value = false;
		}
	}
	if (args === "toggleOrphans") {
		showOrphans.value = !showOrphans.value;
	}
	if (dataGraph.value != null) {
		//eslint-disable-next-line
		//@ts-ignore
		dataGraph.value.emitNetworkControls(args);
	}
}

const isRunning = computed(() => {
	//eslint-disable-next-line
	//@ts-ignore
	return dataGraph.value?.layoutIsRunning;
});

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
					:layout-running="isRunning"
					:is-fullscreen="isFullscreen"
					:show-orphans="showOrphans"
					@network-control-event="(args) => emitControls(args)"
				/>
				<NetworkLegendPanel
					v-if="height && width"
					class="m-3 bg-white/90"
					:system-classes="relevantSystemClasses"
					:excluded-classes="searchFilters.excludeSystemClasses"
					@submit="onChangeSearchFilters"
				/>
			</div>
			<DataGraph
				ref="dataGraph"
				:network-data="entities"
				:search-node="searchFilters.search"
				:detail-node="detailEntityId"
				:show-orphans="showOrphans"
			/>
			<Centered v-if="isLoading" class="pointer-events-none">
				<LoadingIndicator class="text-neutral-950" size="lg" />
			</Centered>
		</VisualisationContainer>
	</div>
</template>
