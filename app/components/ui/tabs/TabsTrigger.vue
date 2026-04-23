<script lang="ts" setup>
import { TabsTrigger, type TabsTriggerProps } from "radix-vue";

import { cn } from "@/utils/styles";

const props = defineProps<TabsTriggerProps & { class?: string }>();
</script>

<template>
	<TabsTrigger
		v-bind="props"
		:class="
			cn(
				'inline-flex items-center justify-center rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap ring-offset-background transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm',
				props.class,
			)
		"
	>
		<slot />
	</TabsTrigger>
</template>
