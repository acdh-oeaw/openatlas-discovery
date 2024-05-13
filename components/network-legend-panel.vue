<script setup lang="ts">
import { colors } from "../project.config.json";

export interface SearchFormData {
	category: string;
}

const props = defineProps<{
	systemClasses: Array<string>;
}>();

const emit = defineEmits<{
	(event: "submit", values: SearchFormData): void;
}>();

function onSubmit(element: string) {
	emit("submit", {
		category: element,
	});
}

const labels = {
	place: "Place",
	source: "Source",
	person: "Person",
	group: "Group",
	move: "Move",
	event: "Event",
	activity: "Activity",
	acquisition: "Acqusition",
	feature: "Feature",
	human_remains: "Human Remains",
	stratigraphic_unit: "Stratigraphic Unit",
	artifact: "Artifact",
	file: "File",
	type: "Type",
	object_location: "Object Location",
	bibliography: "Bibliography",
	edition: "Edition",
	administrative_unit: "Administrative Unit",
	reference_system: "Reference System",
	source_translation: "Source Translation",
};

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
			:style="`color: ${systemClassColors[el] ? systemClassColors[el] : '#666'}`"
		>
			<div class="grid grid-cols-[auto_1fr] gap-2">
				<input
					:id="el"
					type="checkbox"
					name="systemClassCheckbox"
					:style="`accent-color: ${systemClassColors[el] ? systemClassColors[el] : '#666'}`"
					checked
					@submit="onSubmit(el)"
				/>
				<span v-if="labels[el]">{{ labels[el] }}</span>
				<span v-else> {{ el }}</span>
			</div>
		</div>
	</aside>
</template>
