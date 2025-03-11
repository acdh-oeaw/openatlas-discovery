<script setup lang="ts">
import type { NetworkSearchData } from "@/components/data-network-view.vue";
import { networkConfig } from "@/config/network-visualisation.config";

const t = useTranslations();

type SystemClassData = Omit<NetworkSearchData, "search">;

const props = defineProps<{
	systemClasses: Array<string>;
	searchFilters: Array<string>;
}>();

const emit = defineEmits<{
	(event: "submit", values: SystemClassData): void;
}>();

const checkedSystemClasses = ref<Record<string, boolean>>({});

watch(
	() => {
		return props.systemClasses;
	},
	() => {
		if (props.searchFilters.length > 0) return;
		checkedSystemClasses.value = Object.fromEntries(
			props.systemClasses.map((label) => {
				return [label, true];
			}),
		);
	},
	{ immediate: true },
);

watch(
	() => {
		return props.searchFilters;
	},
	() => {
		props.searchFilters.forEach((element) => {
			checkedSystemClasses.value[element] = true;
		});
	},
	{ immediate: true },
);

function onSubmit() {
	emit("submit", {
		excludeSystemClasses: Object.entries(checkedSystemClasses.value)
			.filter((entry) => {
				return !entry[1];
			})
			.map((entry) => {
				return entry[0];
			}),
	});
}

const labels = {
	place: t("SystemClassNames.place"),
	source: t("SystemClassNames.source"),
	person: t("SystemClassNames.person"),
	group: t("SystemClassNames.group"),
	move: t("SystemClassNames.move"),
	creation: t("SystemClassNames.creation"),
	production: t("SystemClassNames.production"),
	modification: t("SystemClassNames.modification"),
	event: t("SystemClassNames.event"),
	activity: t("SystemClassNames.activity"),
	acquisition: t("SystemClassNames.acquisition"),
	feature: t("SystemClassNames.feature"),
	human_remains: t("SystemClassNames.human_remains"),
	stratigraphic_unit: t("SystemClassNames.stratigraphic_unit"),
	artifact: t("SystemClassNames.artifact"),
	file: t("SystemClassNames.file"),
	type: t("SystemClassNames.type"),
	object_location: t("SystemClassNames.object_location"),
	bibliography: t("SystemClassNames.bibliography"),
	edition: t("SystemClassNames.edition"),
	administrative_unit: t("SystemClassNames.administrative_unit"),
	reference_system: t("SystemClassNames.reference_system"),
	source_translation: t("SystemClassNames.source_translation"),
};

const systemClassColors = networkConfig.colors.entityColors;
</script>

<template>
	<aside
		class="flex max-h-72 gap-2 overflow-y-auto overflow-x-hidden rounded-md border-2 border-transparent bg-white px-4 py-2 text-sm shadow-md"
	>
		<div
			v-for="el in props.systemClasses"
			:key="el"
			class="grid grid-cols-[auto_1fr] gap-3"
			:style="`color: ${el in systemClassColors ? systemClassColors[el as keyof typeof systemClassColors] : '#666'}`"
		>
			<div class="grid grid-cols-[auto_1fr] gap-2">
				<input
					:id="el"
					v-model="checkedSystemClasses[el]"
					type="checkbox"
					:checked="checkedSystemClasses[el]"
					name="systemClassCheckbox"
					:style="`accent-color: ${systemClassColors[el as keyof typeof systemClassColors] ? systemClassColors[el as keyof typeof systemClassColors] : '#666'}`"
					@change="onSubmit()"
				/>
				<span v-if="el in labels" class="self-center">{{ labels[el as keyof typeof labels] }}</span>
				<span v-else class="self-center"> {{ el }}</span>
			</div>
		</div>
	</aside>
</template>
