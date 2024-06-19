<script lang="ts" setup>
const props = defineProps<{
	entities: Array<EntityFeature>;
}>();

const features = computed(() => {
	return props.entities.map((entity) => {
		return createGeoJsonFeature(entity);
	});
});
</script>

<template>
	<Card class="h-96 overflow-hidden">
		<VisualisationContainer v-slot="{ height, width }">
			<GeoMap
				v-if="height && width"
				:features="features"
				:movements="features"
				:height="height"
				:width="width"
				:polygons="true"
				:show-movements="true"
			/>
		</VisualisationContainer>
	</Card>
</template>
