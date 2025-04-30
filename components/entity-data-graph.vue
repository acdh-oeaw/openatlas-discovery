<script setup lang="ts">
import Graph from "graphology";

import type { EntityFeature } from "@/composables/use-create-entity";
import { networkConfig } from "@/config/network-visualisation.config";

const props = defineProps<{
	networkData: EntityFeature;
	id: number;
}>();

const { getUnprefixedId } = useIdPrefix();

const graph = new Graph();

const { entityColors } = networkConfig.colors;
const defaultColor = networkConfig.colors.entityDefaultColor;

const { data: allSystemClasses } = useGetSystemClassCount();

const relevantSystemClasses = computed(() => {
	if (!allSystemClasses.value) return [];
	return Object.entries(allSystemClasses.value)
		.filter(([key, value]) => {
			return value > 0 && !project.network.excludeSystemClasses.includes(key);
		})
		.map(([key, _]) => {
			return key;
		})
		.filter((key) => {
			return (
				props.networkData.relations.find((rel) => {
					return rel.systemClass === key;
				}) ?? props.networkData.systemClass === key
			);
		});
});

watch(
	() => {
		return props.networkData;
	},
	(networkData) => {
		/** Clear previous graph data. */
		graph.clear();

		/** Add source node. */
		graph.addNode(props.id, {
			label: networkData.properties.title,
			color: getNodeColor(networkData.systemClass),
			size: networkConfig.sourceNodeSize,
			x: Math.random(),
			y: Math.random(),
		});

		/** Add relations to target nodes. */
		networkData.relations.forEach((element) => {
			if (element.relationTo == null) return;

			const relationId = getUnprefixedId(element.relationTo);
			const nodeClass = element.relationSystemClass;

			if (!relevantSystemClasses.value.includes(nodeClass) || nodeClass === "object_location")
				return;
			graph.addNode(relationId, {
				label: element.label,
				color: getNodeColor(nodeClass),
				size: networkConfig.relationNodeSize,
				url: element.relationTo,
				x: Math.random(),
				y: Math.random(),
			});

			graph.addEdge(props.id, relationId);
		});
	},
	{ immediate: true },
);

function getNodeColor(nodeClass: string) {
	//@ts-expect-error: no error occurs
	return entityColors[nodeClass] ?? defaultColor;
}
</script>

<template>
	<div class="absolute bottom-0 z-10 flex w-full max-w-full justify-end">
		<NetworkLegendPanel
			:excluded-classes="[]"
			:system-classes="relevantSystemClasses"
			:allow-filtering="false"
		></NetworkLegendPanel>
	</div>
	<Network
		v-if="graph.size > 0"
		:graph="graph"
		:show-orphans="false"
		network-container-id="ego-network"
	/>
</template>
