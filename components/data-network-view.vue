<script lang="ts" setup>
const { data, error, isPending, isPlaceholderData, suspense } = useGetNetworkData(
	computed(() => {
		return {
			exclude_system_classes: ["type", "object_location", "reference_system"],
		};
	}),
);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entities = computed(() => {
	return (
		data.value?.results?.flatMap((result) => {
			return result;
		}) ?? []
	);
});

</script>

<template>
	<VisualisationContainer
		v-slot="{ height, width }"
		class="border"
		:class="{ 'opacity-50 grayscale': isLoading }"
	>
		<DataGraph :network-data="entities" />
		<Centered v-if="isLoading" class="pointer-events-none">
			<LoadingIndicator class="text-neutral-950" size="lg" />
		</Centered>
	</VisualisationContainer>
</template>
