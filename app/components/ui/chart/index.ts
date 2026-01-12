export { default as ChartCrosshair } from "@/components/ui/chart/ChartCrosshair.vue";
export { default as ChartLegend } from "@/components/ui/chart/ChartLegend.vue";
export { default as ChartSingleTooltip } from "@/components/ui/chart/ChartSingleTooltip.vue";
export { default as ChartTooltip } from "@/components/ui/chart/ChartTooltip.vue";

export function defaultColors(count = 3) {
	const quotient = Math.floor(count / 2);
	const remainder = count % 2;

	const primaryCount = quotient + remainder;
	const secondaryCount = quotient;

	return [
		...Array.from(new Array(primaryCount).keys()).map((i) => {
			return `hsl(var(--vis-primary-color) / ${String(1 - (1 / primaryCount) * i)})`;
		}),
		...Array.from(new Array(secondaryCount).keys()).map((i) => {
			return `hsl(var(--vis-secondary-color) / ${String(1 - (1 / secondaryCount) * i)})`;
		}),
	];
}

export type * from "./interface";
