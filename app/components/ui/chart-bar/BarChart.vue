<script setup lang="ts" generic="T extends Record<string, any>">
import { Axis, type BulletLegendItemInterface, GroupedBar, StackedBar } from "@unovis/ts";
import { VisAxis, VisGroupedBar, VisStackedBar, VisXYContainer } from "@unovis/vue";
// import { useMounted } from "@vueuse/core";
import { type Component, computed, ref } from "vue";

import { ChartCrosshair, ChartLegend, defaultColors } from "@/components/ui/chart";
import { cn } from "@/utils/styles";

import type { BaseChartProps } from ".";

const props = withDefaults(
	defineProps<
		BaseChartProps<T> & {
			/**
			 * Render custom tooltip component.
			 */
			customTooltip?: Component;
			/**
			 * Change the type of the chart
			 * @default "grouped"
			 */
			type?: "grouped" | "stacked";
			/**
			 * Rounded bar corners
			 * @default 0
			 */
			roundedCorners?: number;
			height: number;
			width: number;
		}
	>(),
	{
		type: "grouped",
		margin: () => {
			return { top: 0, bottom: 0, left: 0, right: 0 };
		},
		filterOpacity: 0.2,
		roundedCorners: 0,
		showXAxis: true,
		showYAxis: true,
		showTooltip: true,
		showLegend: true,
		showGridLine: true,
	},
);
const emits = defineEmits<{
	legendItemClick: [d: BulletLegendItemInterface, i: number];
	onBarClick: [d: Data];
}>();

function onBarClick(d: Data) {
	emits("onBarClick", d);
}

const legendRef = ref<HTMLElement | null>(null);
const legendHeight = computed(() => {
	return legendRef.value?.offsetHeight ?? 0;
});

onMounted(async () => {
	await nextTick();
});
type Data = (typeof props.data)[number];

const index = computed(() => {
	return props.index;
});
const colors = computed(() => {
	return props.colors?.length ? props.colors : defaultColors(props.categories.length);
});
const legendItems = ref<Array<BulletLegendItemInterface>>(
	props.categories.map((category, i) => {
		return {
			name: category,
			color: colors.value[i],
			inactive: false,
		};
	}),
);

function handleLegendItemClick(d: BulletLegendItemInterface, i: number) {
	emits("legendItemClick", d, i);
}

const VisBarComponent = computed(() => {
	return props.type === "grouped" ? VisGroupedBar : VisStackedBar;
});
const selectorsBar = computed(() => {
	return props.type === "grouped" ? GroupedBar.selectors.bar : StackedBar.selectors.bar;
});
</script>

<template>
	<div
		:class="cn('flex size-full flex-col items-end', $attrs.class ?? '')"
		:style="{ width: props.width + 'px', height: props.height + 'px' }"
	>
		<ChartLegend
			v-if="showLegend"
			ref="legendRef"
			v-model:items="legendItems"
			@legend-item-click="handleLegendItemClick"
		/>
		<!-- @vue-expect-error ".value" is needed here  -->
		<VisXYContainer
			:data="data"
			class="flex-1"
			:margin="margin"
			:height="props.height - (legendHeight.value ?? 40)"
			:width="props.width - 5"
		>
			<ChartCrosshair
				v-if="showTooltip"
				:colors="colors"
				:items="legendItems"
				:custom-tooltip="customTooltip"
				:index="index"
			/>

			<VisBarComponent
				:x="(d: Data, i: number) => i"
				:y="categories.map((category: string) => (d: Data) => d[category])"
				:color="colors"
				:rounded-corners="roundedCorners"
				:bar-padding="0.05"
				:attributes="{
					[selectorsBar]: {
						opacity: (d: Data, i: number) => {
							const pos = i % categories.length;
							return legendItems[pos]?.inactive ? filterOpacity : 1;
						},
					},
				}"
				:events="{
					[selectorsBar]: {
						click: (d: Data) => {
							onBarClick(d);
						},
					},
				}"
			/>

			<VisAxis
				v-if="showXAxis"
				type="x"
				:tick-format="xFormatter ?? ((v: number) => data[v]?.[index])"
				:grid-line="false"
				:tick-line="false"
				tick-text-color="var(--muted-foreground)"
				:tick-text-angle="45"
				:num-ticks="data.length"
			/>
			<VisAxis
				v-if="showYAxis"
				type="y"
				:tick-line="false"
				:tick-format="yFormatter"
				:domain-line="false"
				:grid-line="showGridLine"
				:attributes="{
					[Axis.selectors.grid]: {
						class: 'text-muted',
					},
				}"
				tick-text-color="var(--muted-foreground)"
			/>

			<slot />
		</VisXYContainer>
	</div>
</template>
