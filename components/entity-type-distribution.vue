<script setup lang="ts">
import type { TypeTreeModel } from "@/types/api";

import BarChart from "./ui/chart-bar/BarChart.vue";

const router = useRouter();

const props = defineProps<{
	id: number;
	width: number;
	height: number;
}>();

const { data, isLoading } = useGetTypeDistribution();

const types = computed(() => {
	// current entity.id type
	// @ts-expect-error wrong in OpenAPI schema, see https://redmine.openatlas.eu/issues/2625
	const currentType = data.value?.typeTree[props.id];

	// all subtypes of currentType
	// @ts-expect-error wrong in OpenAPI schema, see https://redmine.openatlas.eu/issues/2625
	const subTypes = Object.values(data.value?.typeTree as TypeTreeModel["type_tree"]).filter(
		(el) => {
			return currentType.subs.includes(el.id);
		},
	);

	return [currentType, ...subTypes].map((el) => {
		return {
			id: el.id,
			name: el.name,
			count: Number(el.count ?? 0),
		};
	});
});

function onBarClick(d: (typeof types.value)[0]) {
	const entity = types.value.find((el) => {
		return el.id === d.id;
	});
	if (!entity) return;
	const currentRoute = router.currentRoute.value; // get current route snapshot
	const newQuery = { ...currentRoute.query, selection: entity.id }; // merge existing queries + new selection

	void router.push({ path: currentRoute.path, query: newQuery });
}
</script>

<template>
	<div v-if="!isLoading && types.length && props.height && props.width">
		<BarChart
			class="relative"
			:data="types"
			index="name"
			:categories="['count']"
			:colors="[project.colors.brand]"
			:y-formatter="
				(count) => {
					return String(count);
				}
			"
			:show-x-axis="false"
			:width="props.width"
			:height="props.height"
			:margin="{ left: 10, bottom: 3 }"
			@on-bar-click="onBarClick"
		/>
	</div>
	<Centered v-else class="pointer-events-none">
		<LoadingIndicator class="text-neutral-950" />
	</Centered>
</template>
