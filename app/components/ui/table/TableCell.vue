<script lang="ts" setup>
import { cn } from "@/utils/styles";

const props = defineProps<{ class?: string }>();
</script>

<template>
	<td
		:class="
			cn(
				'p-2 align-middle *:[[role=checkbox]]:translate-y-[2px] [&:has([role=checkbox])]:pr-0',
				props.class,
			)
		"
	>
		<slot />
	</td>
</template>
