<script lang="ts" setup>
import { cn } from "@/utils/styles";

const props = defineProps({
	class: {
		type: String,
		default: "",
	},
});
</script>

<template>
	<h3 :class="cn('leading-none font-semibold tracking-tight', props.class)">
		<slot />
	</h3>
</template>
