<script setup lang="ts">
import { DotIcon, EllipsisIcon } from "lucide-vue-next";

import type { NetworkSearchData } from "@/components/data-network-view.vue";
import { networkConfig } from "@/config/network-visualisation.config";

const t = useTranslations();

type SystemClassData = Omit<NetworkSearchData, "search">;

const props = defineProps<{
	systemClasses: Array<string>;
	excludedClasses: Array<string>;
	allowFiltering: boolean;
}>();

const emit = defineEmits<{
	(event: "submit", values: SystemClassData): void;
}>();

const checkedSystemClasses = ref<Record<string, boolean>>({});
let showLegend = ref(false);

watch(
	() => {
		return props.systemClasses;
	},
	() => {
		// if (props.excludedClasses.length > 0) return;
		checkedSystemClasses.value = Object.fromEntries(
			props.systemClasses.map((label) => {
				return [label, true];
			}),
		);
		props.excludedClasses.forEach((element) => {
			checkedSystemClasses.value[element] = false;
		});
	},
	{ immediate: true },
);

watch(
	() => {
		return props.excludedClasses;
	},
	() => {
		props.excludedClasses.forEach((element) => {
			checkedSystemClasses.value[element] = false;
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
function toggleShowLegend() {
	showLegend.value = !showLegend.value;
}
</script>

<template>
	<aside
		:class="
			props.allowFiltering
				? `flex max-h-72 gap-2 overflow-y-auto overflow-x-hidden rounded-md border-2 border-transparent bg-white px-4 py-2 text-sm shadow-md`
				: `flex gap-2 overflow-x-auto rounded-md border-2 border-transparent bg-white m-2 text-sm shadow-md`
		"
	>
		<div v-if="props.allowFiltering" class="inline-flex">
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
					<span v-if="el in labels" class="self-center">{{
						labels[el as keyof typeof labels]
					}}</span>
					<span v-else class="self-center"> {{ el }}</span>
				</div>
			</div>
		</div>
		<div v-else>
			<Button
				variant="transparent"
				size="icon"
				:class="{ 'text-brand': showLegend }"
				@click="toggleShowLegend()"
			>
				<EllipsisIcon class="p-0" />
			</Button>
		</div>
	</aside>

	<Teleport to="#ego-network-legend">
		<div v-if="showLegend" class="absolute right-0">
			<Card class="min-w-max">
				<CardContent class="p-4 text-sm">
					<div
						v-for="el in props.systemClasses"
						:key="el"
						class="mb-2 grid grid-cols-[auto_1fr]"
						:style="`color: ${el in systemClassColors ? systemClassColors[el as keyof typeof systemClassColors] : '#666'}`"
					>
						<svg height="24" width="24" xmlns="http://www.w3.org/2000/svg">
							<circle
								r="3"
								cx="12"
								cy="12"
								:fill="systemClassColors[el as keyof typeof systemClassColors]"
							/>
						</svg>
						<span v-if="el in labels" class="self-center">
							{{ labels[el as keyof typeof labels] }}
						</span>
						<span v-else class="self-center"> {{ el }}</span>
					</div>
				</CardContent>
			</Card>
		</div>
	</Teleport>
</template>
