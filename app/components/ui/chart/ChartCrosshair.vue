<script setup lang="ts">
import { type BulletLegendItemInterface, omit } from "@unovis/ts";
import { VisCrosshair, VisTooltip } from "@unovis/vue";
import { type Component, createApp } from "vue";

import { ChartTooltip } from ".";

const props = withDefaults(
	defineProps<{
		colors?: Array<string>;
		index: string;
		items: Array<BulletLegendItemInterface>;
		customTooltip?: Component;
	}>(),
	{
		colors: () => {
			return [];
		},
	},
);

// Use weakmap to store reference to each datapoint for Tooltip
const wm = new WeakMap();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function template(d: any) {
	if (wm.has(d)) {
		return wm.get(d);
	} else {
		const componentDiv = document.createElement("div");
		const omittedData = Object.entries(omit(d, [props.index]))
			.filter(([key]) => {
				return key !== "id";
			})
			.map(([key, value]) => {
				const legendReference = props.items.find((i) => {
					return i.name === key;
				});
				return { ...legendReference, value };
			});
		const TooltipComponent = props.customTooltip ?? ChartTooltip;
		if (d[props.index] == null) return "";
		// eslint-disable-next-line vue/component-api-style
		createApp(TooltipComponent, { title: d[props.index].toString(), data: omittedData }).mount(
			componentDiv,
		);
		wm.set(d, componentDiv.innerHTML);
		return componentDiv.innerHTML;
	}
}

function color(d: unknown, i: number) {
	return props.colors[i] ?? "transparent";
}
</script>

<template>
	<VisTooltip :horizontal-shift="20" :vertical-shift="20" />
	<VisCrosshair :template="template" :color="color" />
</template>
