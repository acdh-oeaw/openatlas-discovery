<script setup lang="ts">
import { BulletLegend, type BulletLegendItemInterface } from "@unovis/ts";
import { VisBulletLegend } from "@unovis/vue";
import { nextTick, onMounted, ref } from "vue";

import { buttonVariants } from "@/components/ui/button";

const props = withDefaults(defineProps<{ items: Array<BulletLegendItemInterface> }>(), {
	items: () => {
		return [];
	},
});

const emits = defineEmits<{
	legendItemClick: [d: BulletLegendItemInterface, i: number];
	"update:items": [payload: Array<BulletLegendItemInterface>];
}>();

const elRef = ref<HTMLElement>();

async function keepStyling() {
	const selector = `.${BulletLegend.selectors.item}`;
	await nextTick(() => {
		const elements = elRef.value?.querySelectorAll(selector);
		const classes = buttonVariants({ variant: "ghost", size: "sm" }).split(" ");
		elements?.forEach((el) => {
			el.classList.add(...classes, "!inline-flex", "!mr-2");
		});
	});
}

onMounted(async () => {
	await keepStyling();
});

async function onLegendItemClick(d: BulletLegendItemInterface, i: number) {
	emits("legendItemClick", d, i);
	const isBulletActive = !props.items[i]?.inactive;
	const isFilterApplied = props.items.some((i) => {
		return i.inactive;
	});
	if (isFilterApplied && isBulletActive) {
		// reset filter
		emits(
			"update:items",
			props.items.map((item) => {
				return { ...item, inactive: false };
			}),
		);
	} else {
		// apply selection, set other item as inactive
		emits(
			"update:items",
			props.items.map((item) => {
				return item.name === d.name ? { ...d, inactive: false } : { ...item, inactive: true };
			}),
		);
	}
	await keepStyling();
}
</script>

<template>
	<div
		ref="elRef"
		class="w-max"
		:style="{
			'--vis-legend-bullet-size': '16px',
		}"
	>
		<VisBulletLegend :items="items" :on-legend-item-click="onLegendItemClick" />
	</div>
</template>
