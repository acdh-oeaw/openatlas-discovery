<script setup lang="ts">
import type { PresentationViewModel } from "@/types/api";

import BarChart from "./ui/chart-bar/BarChart.vue";

const router = useRouter();
const route = useRoute();
const { locale } = useI18n();

const props = defineProps<{
	id: number;
	width: number;
	height: number;
}>();

const { data, isLoading } = useGetTypeDistribution();

const types = computed(() => {
	// current entity.id type
	const currentType = data.value?.typeTree[props.id];

	// all subtypes of currentType
	const subTypes = Object.values(data.value?.typeTree).filter((el) => {
		return currentType.subs.includes(el.id);
	});

	return [currentType, ...subTypes].map((el) => {
		return {
			id: el.id,
			name: el.name,
			count: Number(el.count ?? 0),
		};
	});
});

function onBarClick(d: PresentationViewModel) {
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
				(count: number) => {
					return String(count);
				}
			"
			:show-x-axis="false"
			:width="props.width"
			:height="props.height"
			@on-bar-click="onBarClick"
		/>
	</div>
	<Centered v-else class="pointer-events-none">
		<LoadingIndicator class="text-neutral-950" />
	</Centered>
</template>
