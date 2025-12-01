<script setup lang="ts">
import EntityDataGraph from "@/components/entity-data-graph.vue";

const props = defineProps<{
	networkData: EntityFeature | undefined;
	id: number;
}>();
const depth = ref(1);

const { data: egoNetworkData } = useGetEgoNetworkData(
	// @ts-expect-error Includes custom, per-instance system classes.
	computed(() => {
		return {
			id: props.id,
			depth: depth.value,
			exclude_system_classes: project.network.excludeSystemClasses,
		};
	}),
);
function updateDepth(newDepth: number) {
	depth.value = newDepth;
}
</script>

<template>
	<Card class="h-96 overflow-hidden">
		<VisualisationContainer>
			<EntityDataGraph
				v-if="egoNetworkData != null"
				:id="props.id"
				:current-depth="depth"
				:network-data="egoNetworkData"
				@change-depth="(val) => updateDepth(val)"
			/>
		</VisualisationContainer>
	</Card>
</template>
