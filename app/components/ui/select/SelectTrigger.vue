<script lang="ts" setup>
import { ChevronDownIcon } from "lucide-vue-next";
import { SelectIcon, SelectTrigger, type SelectTriggerProps } from "radix-vue";

import { cn } from "@/utils/styles";

const props = withDefaults(
	defineProps<SelectTriggerProps & { class?: string; invalid?: boolean }>(),
	{
		class: "",
		invalid: false,
	},
);
</script>

<template>
	<SelectTrigger
		v-bind="props"
		:class="[
			cn(
				'flex h-9 w-full items-center justify-between gap-x-1.5 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-sm ring-offset-background focus:ring-1 focus:ring-ring focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 data-placeholder:text-muted-foreground [&>span]:min-w-0 [&>span]:truncate',
				props.class,
			),
			props.invalid ? 'ring-2 ring-destructive! data-placeholder:text-destructive!' : '',
		]"
	>
		<slot />
		<SelectIcon as-child>
			<ChevronDownIcon class="size-4 opacity-50" />
		</SelectIcon>
	</SelectTrigger>
</template>
