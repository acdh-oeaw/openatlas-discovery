<script setup lang="ts">
import { colors } from "../project.config.json";

const props = defineProps<{
	systemClasses: Array<string>;
}>();

const systemClassColors = colors.entityColors;
</script>

<template>
	<aside
		class="flex max-h-72 gap-2 overflow-y-auto overflow-x-hidden rounded-md border-2 border-transparent bg-white px-4 py-2 text-sm shadow-md"
	>
		<div
			v-for="el in props.systemClasses"
			:key="el"
			class="grid grid-cols-[auto_1fr] gap-3"
			:style="`color: ${systemClassColors[el]}`"
		>
			<div class="grid grid-cols-[auto_1fr] gap-2">
				<input
					:id="el"
					type="checkbox"
					name="systemClassCheckbox"
					:style="`background-color: ${systemClassColors[el]}`"
				/>
				{{ el }}
			</div>
		</div>
	</aside>
</template>
