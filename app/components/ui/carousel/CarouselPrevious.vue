<script setup lang="ts">
import { ArrowLeftIcon } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styles";

import type { WithClassAsProps } from "./interface";
import { useCarousel } from "./useCarousel";

const props = defineProps<WithClassAsProps>();

const { orientation, canScrollPrev, scrollPrev } = useCarousel();
</script>

<template>
	<Button
		:disabled="!canScrollPrev"
		:class="
			cn(
				'absolute size-8 touch-manipulation rounded-full p-0',
				orientation === 'horizontal'
					? 'top-1/2 -left-12 -translate-y-1/2'
					: '-top-12 left-1/2 -translate-x-1/2 rotate-90',
				props.class,
			)
		"
		variant="outline"
		@click="scrollPrev"
	>
		<slot>
			<ArrowLeftIcon aria-hidden="true" class="size-4 shrink-0 text-current" />
		</slot>
	</Button>
</template>
