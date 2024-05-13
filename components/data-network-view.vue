<script lang="ts" setup>
import { z } from "zod";

import type { SearchFormData } from "@/components/search-form.vue";

const router = useRouter();
const route = useRoute();
const t = useTranslations();

const searchFiltersSchema = z.object({
	search: z.string().catch(""),
});

const searchFilters = computed(() => {
	return searchFiltersSchema.parse(route.query);
});

type SearchFilters = z.infer<typeof searchFiltersSchema>;

function setSearchFilters(query: Partial<SearchFilters>) {
	void router.push({ query });
}

function onChangeSearchFilters(values: SearchFormData) {
	setSearchFilters(values);
}

const { data, error, isPending, isPlaceholderData, suspense } = useGetNetworkData(
	computed(() => {
		return {
			exclude_system_classes: [
				"type",
				"object_location",
				"reference_system",
				"file",
				"source_translation",
				"source",
				"bibliography",
				"external_reference",
				"administrative_unit",
				"edition",
			],
		};
	}),
);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entities = computed(() => {
	return (
		data.value?.results.flatMap((result) => {
			return result;
		}) ?? []
	);
});

const systemClasses = computed(() => {
	const systemClasses: Array<string> = [];

	entities.value.forEach((entity) => {
		if (!systemClasses.includes(entity.systemClass)) {
			systemClasses.push(entity.systemClass);
		}
	});

	return systemClasses;
});

</script>

<template>
	<div class="relative grid grid-rows-[auto_1fr] gap-4">
		<NetworkSearchForm :search="searchFilters.search" @submit="onChangeSearchFilters" />

		<VisualisationContainer
			v-slot="{ height, width }"
			class="border"
			:class="{ 'opacity-50 grayscale': isLoading }"
		>
			<NetworkLegendPanel
				class="absolute bottom-0 right-0 z-10 m-3"
				:system-classes="systemClasses"
				@submit="onChangeSearchFilters"
			></NetworkLegendPanel>
			<DataGraph :network-data="entities" :search-node="searchFilters.search" />
			<Centered v-if="isLoading" class="pointer-events-none">
				<LoadingIndicator class="text-neutral-950" size="lg" />
			</Centered>
		</VisualisationContainer>
	</div>
</template>
