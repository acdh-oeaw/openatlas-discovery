<script lang="ts" setup>
import { cn } from "@/utils/styles";

const props = defineProps<{ class?: string }>();
</script>

<template>
	<th
		:class="
			cn(
				'h-10 px-2 text-left align-middle font-medium text-muted-foreground *:[[role=checkbox]]:translate-y-[2px] [&:has([role=checkbox])]:pr-0',
				props.class,
			)
		"
	>
		<slot />
	</th>
</template>
