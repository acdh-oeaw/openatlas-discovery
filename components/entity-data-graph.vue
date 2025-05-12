<script setup lang="ts">
import Graph from "graphology";
import { useTemplateRef } from "vue";

import type { NetworkTemplateRef } from "@/components/data-graph.vue";
import { networkConfig } from "@/config/network-visualisation.config";
import type { NetworkEntity } from "@/types/api";

const props = defineProps<{
	networkData: NetworkEntity;
	currentDepth: number;
}>();

const emit = defineEmits<{
	(event: "changeDepth", values: number): void;
}>();

const graph = new Graph();

const { entityColors } = networkConfig.colors;
const defaultColor = networkConfig.colors.entityDefaultColor;

const { data: allSystemClasses } = useGetSystemClassCount();

const relevantSystemClasses = computed(() => {
	if (!allSystemClasses.value) return [];
	return Object.entries(allSystemClasses.value)
		.map(([key, _]) => {
			return key;
		})
		.filter((key) => {
			return props.networkData.find((rel) => {
				return rel.systemClass === key;
			});
		});
});

watch(
	() => {
		return props.networkData;
	},
	() => {
		/** Clear previous graph data. */
		graph.clear();

		console.log("entity ego network data: ", props.networkData);

		if (props.networkData.length <= 0) return;

		props.networkData.forEach((element) => {
			graph.addNode(element.id, {
				label: element.label,
				color: getNodeColor(element.systemClass),
				size: networkConfig.relationNodeSize,
				x: Math.random(),
				y: Math.random(),
			});
		});

		props.networkData.forEach((entity) => {
			entity.relations.forEach((element) => {
				if (!graph.hasEdge(entity.id, element) && graph.hasNode(element)) {
					graph.addEdge(entity.id, element);
				} else if (!graph.hasNode(element)) {
					console.error(
						"graph does not have the node",
						element,
						"for the wanted relation in it's set.",
					);
				}
			});
		});

		void nextTick(() => {
			if (network.value && !network.value.isRunning)
				network.value?.handleNetworkControls("toggleRenderer");
		});
	},
	{ immediate: true },
);

function getNodeColor(nodeClass: string) {
	//@ts-expect-error: no error occurs
	return entityColors[nodeClass] ?? defaultColor;
}

const network = useTemplateRef<NetworkTemplateRef>("networkClient");
</script>

<template>
	<div class="absolute bottom-0 z-10 flex w-full max-w-full justify-end">
		<NetworkLegendPanel
			:excluded-classes="[]"
			:system-classes="relevantSystemClasses"
			:allow-filtering="false"
			:is-ego-network="true"
			:depth="currentDepth"
			:is-running="network?.isRunning"
			@network-control-event="network?.handleNetworkControls('toggleRenderer')"
			@change-depth="(val) => emit('changeDepth', val)"
		></NetworkLegendPanel>
	</div>
	<Network
		v-if="graph.size > 0"
		ref="networkClient"
		:graph="graph"
		:show-orphans="false"
		network-container-id="ego-network"
	/>
</template>
