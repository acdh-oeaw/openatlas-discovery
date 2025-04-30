<script setup lang="ts">
import Graph from "graphology";
import { useTemplateRef } from "vue";

import { networkConfig } from "@/config/network-visualisation.config";
import type { NetworkEntity } from "@/types/api";

const props = defineProps<{
	networkData: NetworkEntity;
	searchNode: string;
	detailNode?: string;
	showOrphans: boolean;
}>();

const graph = new Graph();

const { entityColors } = networkConfig.colors;
const defaultColor = networkConfig.colors.entityDefaultColor;

interface NetworkTemplateRef {
	handleNetworkControls: (args: string) => void;
	isRunning: boolean;
}
const networkRef = useTemplateRef<NetworkTemplateRef>("networkClient");
function emitNetworkControls(args: string) {
	//eslint-disable-next-line
	//@ts-ignore
	if (networkRef.value) networkRef.value.handleNetworkControls(args);
}

const layoutIsRunning = computed(() => {
	//eslint-disable-next-line
	//@ts-ignore
	return networkRef.value?.isRunning;
});

defineExpose({
	emitNetworkControls,
	layoutIsRunning,
});

watch(
	() => {
		return props.networkData;
	},
	(networkData) => {
		/** Clear previous graph data. */
		graph.clear();

		if (networkData.length === 0) return;

		/** Add all nodes. */
		networkData.forEach((entity) => {
			if (!graph.hasNode(entity.id) && entity.systemClass) {
				graph.addNode(entity.id, {
					label: entity.label,
					color: getNodeColor(entity.systemClass),
					size: networkConfig.sourceNodeSize,
					//set random value to prevent sigma error related to undefined x,y values
					x: Math.random(),
					y: Math.random(),
				});
			}
		});

		//** Add edges. */
		networkData.forEach((entity) => {
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

		if (!layoutIsRunning.value) {
			//eslint-disable-next-line
			//@ts-ignore
			networkRef.value?.handleNetworkControls("toggleRenderer");
		}
	},
	{ immediate: true },
);

function getNodeColor(nodeClass: string) {
	//@ts-expect-error: no error occurs
	return entityColors[nodeClass] ?? defaultColor;
}
</script>

<template>
	<div class="absolute z-10 m-3 flex w-full"></div>
	<Network
		v-if="graph.size > 0"
		ref="networkClient"
		:graph="graph"
		:search-node="props.searchNode"
		:detail-node="props.detailNode"
		:show-orphans="props.showOrphans"
		network-container-id="network-view"
	/>
</template>
