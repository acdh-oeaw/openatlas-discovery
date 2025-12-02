<script setup lang="ts">
import { AccordionContent, type AccordionContentProps } from "radix-vue";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<AccordionContentProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<AccordionContent
		v-bind="delegatedProps"
		class="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
	>
		<div :class="cn('pt-0 pb-4', props.class)">
			<slot />
		</div>
	</AccordionContent>
</template>
