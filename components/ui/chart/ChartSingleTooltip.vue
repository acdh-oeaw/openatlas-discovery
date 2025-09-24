<script setup lang="ts">
import { type BulletLegendItemInterface, omit } from "@unovis/ts";
import { VisTooltip } from "@unovis/vue";
import { type Component, createApp } from "vue";

import { ChartTooltip } from ".";

const props = defineProps<{
	selector: string;
	index: string;
	items?: Array<BulletLegendItemInterface>;
	valueFormatter?: (tick: number, i?: number, ticks?: Array<number>) => string;
	customTooltip?: Component;
}>();

// Use weakmap to store reference to each datapoint for Tooltip
const wm = new WeakMap();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function template(d: any, i: number, elements: Array<HTMLElement | SVGElement>) {
	const valueFormatter =
		props.valueFormatter ??
		((tick: number) => {
			return String(tick);
		});
	if (props.index in d) {
		if (wm.has(d)) {
			return wm.get(d);
		} else {
			const componentDiv = document.createElement("div");
			const omittedData = Object.entries(omit(d, [props.index])).map(([key, value]) => {
				const legendReference = props.items?.find((i) => {
					return i.name === key;
				});
				return { ...legendReference, value: valueFormatter(value) };
			});
			const TooltipComponent = props.customTooltip ?? ChartTooltip;
			createApp(TooltipComponent, { title: d[props.index], data: omittedData }).mount(componentDiv);
			wm.set(d, componentDiv.innerHTML);
			return componentDiv.innerHTML;
		}
	} else {
		const data = d.data;

		if (wm.has(data)) {
			return wm.get(data);
		} else {
			if (elements[i] == null) return "";
			const style = getComputedStyle(elements[i]);
			const omittedData = [
				{ name: data.name, value: valueFormatter(data[props.index]), color: style.fill },
			];
			const componentDiv = document.createElement("div");
			const TooltipComponent = props.customTooltip ?? ChartTooltip;
			createApp(TooltipComponent, { title: d[props.index], data: omittedData }).mount(componentDiv);
			wm.set(d, componentDiv.innerHTML);
			return componentDiv.innerHTML;
		}
	}
}
</script>

<template>
	<VisTooltip
		:horizontal-shift="20"
		:vertical-shift="20"
		:triggers="{
			[selector]: template,
		}"
	/>
</template>
