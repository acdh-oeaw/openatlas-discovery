<script setup lang="ts">
import type { NetworkEdge, NetworkNode } from "@/types/network-visualisation";

interface NetworkNodes extends Array<NetworkNode> {}
interface NetworkEdges extends Array<NetworkEdge> {}

const props = defineProps<{
	networkData: Array<{
		nodes: NetworkNodes;
		edges: NetworkEdges;
	}>;
	nodes: NetworkNodes;
	edges: NetworkEdges;
}>();
</script>

<template>
	<Card class="h-96 overflow-hidden">
		<VisualisationContainer v-slot="{ height, width }">
			<Network
				v-if="height && width"
				:network-data="props.networkData"
				:height="height"
				:width="width"
			/>
		</VisualisationContainer>
	</Card>
</template>
