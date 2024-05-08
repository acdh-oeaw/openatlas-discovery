<script setup lang="ts">
import Graph from "graphology";
import { DotIcon } from "lucide-vue-next";

import type { NetworkEntity } from "@/types/api";

import { colors } from "../project.config.json";

const props = defineProps<{
	networkData: NetworkEntity;
}>();

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

		if (networkData.length === 0) return;

		/** Add all nodes */
		networkData.forEach((entity) => {
			if (!graph.hasNode(entity.id) && entity.systemClass) {
				graph.addNode(entity.id, {
					label: entity.label,
					color: getNodeColor(entity.systemClass),
					size: networkConfig.sourceNodeSize,
				});
			}
		});

		//** Add edges */
		networkData.forEach((entity) => {
			entity.relations.forEach((element) => {
				graph.addEdge(entity.id, element);
			});
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
	<Network v-if="graph.size > 0" :graph="graph"></Network>
</template>
