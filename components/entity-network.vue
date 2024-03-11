<script setup lang="ts">
const props = defineProps<{
	networkData: EntityFeature | undefined;
	id: number;
}>();
</script>

<template>
	<Card class="h-96 overflow-hidden">
		<VisualisationContainer v-slot="{ height, width }">
			<Network
				v-if="height && width"
				:id="props.id"
				:network-data="props.networkData"
				:height="height"
				:width="width"
			/>
		</VisualisationContainer>
	</Card>
</template>
