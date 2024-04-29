<script setup lang="ts">
import Graph from "graphology";
import circularpack from "graphology-layout/circlepack";
import { DotIcon } from "lucide-vue-next";

import type { EntityFeature } from "../composables/use-create-entity";
import { networkConfig } from "../config/network-visualisation.config";
import { colors } from "../project.config.json";

const props = defineProps<{
	networkData: EntityFeature;
	id: number;
}>();

const { getUnprefixedId } = useIdPrefix();

let graph = new Graph();

const { entityColors } = colors;
const defaultColor = "#666";
let usedEntities: [string | undefined] = [""];

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
		});

		/** Add source node to agenda of nodes */

		usedEntities.push(networkData.systemClass);

		/** Add relations to target nodes. */
		networkData.relations?.forEach((element) => {
			if (element.relationTo == null) return;

			const relationId = getUnprefixedId(element.relationTo);
			const nodeClass = element.relationSystemClass;

			if (nodeClass == null) return;

			if (!usedEntities.includes(nodeClass)) {
				usedEntities.push(nodeClass);
			}
			graph.addNode(relationId, {
				label: element.label,
				color: getNodeColor(nodeClass),
				size: networkConfig.relationNodeSize,
				url: element.relationTo,
			});

			graph.addEdge(props.id, relationId);
		});

		circularpack.assign(graph, { scale: 100 });
	},
	{ immediate: true },
);

function getNodeColor(nodeClass: string) {
	//@ts-expect-error: no error occurs
	return entityColors[nodeClass] ?? defaultColor;
}
</script>

<template>
	<div class="absolute z-10 m-3 flex w-full">
		<Card class="w-max">
			<span v-for="(color, entity) in entityColors" :key="entity">
				<span v-if="usedEntities.includes(entity)" class="pr-4">
					<DotIcon :size="50" :color="color" class="inline-block" />
					<span>{{ entity }}</span>
				</span>
			</span>
			<span v-for="entry in usedEntities" :key="entry">
				<span
					v-if="entry != null && entry !== '' && !Object.keys(entityColors).includes(entry)"
					class="pr-4"
				>
					<DotIcon :size="50" :color="defaultColor" class="inline-block" />
					<span>{{ entry }}</span>
				</span>
			</span>
		</Card>
	</div>
	<Network v-if="graph !== undefined" :graph="graph"></Network>
</template>
