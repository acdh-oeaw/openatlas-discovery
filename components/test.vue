<script setup lang="ts">
import { z } from "zod";

const route = useRoute();

const searchFiltersSchema = z.object({
	category: z.enum(categories).catch("entityName"),
	search: z.string().catch(""),
	page: z.coerce.number().int().positive().catch(1),
	limit: z.coerce.number().int().positive().max(100).catch(20),
});

const searchFilters = computed(() => {
	return searchFiltersSchema.parse(route.query);
});


const { data } = useGetSearchResults(
	computed(() => {
		const { search, category, ...params } = searchFilters.value;
		return {
			...params,
			search:
				search.length > 0
					? [{ [category]: [{ operator: "like", values: [search], logicalOperator: "and" }] }]
					: [],
			type_id: [],
			view_classes: ["actor", "event", "place", "reference", "source"],
			limit: 0,
		};
	}),
);

</script>

<template>
	<div>
		{{ data }}
	</div>
</template>

