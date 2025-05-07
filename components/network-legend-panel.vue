<script setup lang="ts">
import { CirclePauseIcon, CirclePlayIcon, EllipsisIcon, LayersIcon } from "lucide-vue-next";

import type { NetworkSearchData } from "@/components/data-network-view.vue";
import { networkConfig } from "@/config/network-visualisation.config";

const t = useTranslations();

type SystemClassData = Omit<NetworkSearchData, "search">;

const props = withDefaults(
	defineProps<{
		systemClasses: Array<string>;
		excludedClasses: Array<string>;
		allowFiltering: boolean;
		isEgoNetwork?: boolean;
		depth?: number;
		isRunning?: boolean;
	}>(),
	{ isEgoNetwork: false },
);

const emit = defineEmits<{
	(event: "submit", values: SystemClassData): void;
	(event: "networkControlEvent"): void;
	(event: "changeDepth", values: number): void;
}>();

const checkedSystemClasses = ref<Record<string, boolean>>({});
let showLegend = ref(false);
let showDepth = ref(false);

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
	showDepth.value = false;
	showLegend.value = !showLegend.value;
}

function toggleShowDepth() {
	showDepth.value = !showDepth.value;
}

function onClickControls() {
	emit("networkControlEvent");
}

watch(
	() => {
		return showDepth.value;
	},
	() => {
		showLegend.value = false;
	},
);
</script>

<template>
	<aside
		:class="
			!props.isEgoNetwork
				? `flex max-h-72 gap-2 overflow-y-auto overflow-x-hidden rounded-md border-2 border-transparent bg-white px-4 py-2 text-sm shadow-md`
				: `flex gap-2 overflow-x-auto rounded-md border-2 border-transparent bg-white m-2 text-sm shadow-md`
		"
	>
		<div v-if="!props.isEgoNetwork" class="inline-flex">
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
		<div v-else class="p-1">
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button variant="transparent" size="icon" @click="onClickControls()">
							<span class="sr-only">{{
								props.isRunning ? t("NetworkPage.controls.pause") : t("NetworkPage.controls.start")
							}}</span>
							<component
								:is="props.isRunning ? CirclePauseIcon : CirclePlayIcon"
								:size="20"
								class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
							></component>
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{{
							props.isRunning ? t("NetworkPage.controls.pause") : t("NetworkPage.controls.start")
						}}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<div class="border-separate border" />
			<DropdownMenu v-model:open="showDepth">
				<DropdownMenuTrigger as-child>
					<TooltipProvider as-child>
						<Tooltip>
							<TooltipTrigger>
								<Button
									variant="transparent"
									size="icon"
									:class="{ 'text-brand': showDepth }"
									class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
									@click="toggleShowDepth()"
								>
									{{ props.depth }}
									<LayersIcon class="p-0" :size="20" />
								</Button>
							</TooltipTrigger>
							<TooltipContent>
								{{ t("EntityPage.networkDepth") }}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</DropdownMenuTrigger>

				<DropdownMenuContent
					align="end"
					class="absolute left-auto right-0 top-auto -mr-1 mt-12 min-w-fit transform-none"
					portal-to="#ego-network-legend"
				>
					<DropdownMenuItem v-for="(x, index) in 5" :key="index">
						<Button variant="transparent" size="icon" @click="emit('changeDepth', x)">
							<span :class="{ 'font-bold': x == props.depth }">{{ x }}</span>
						</Button>
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>

			<div class="border-separate border" />
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant="transparent"
							size="icon"
							:class="{ 'text-brand': showLegend }"
							class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
							@click="toggleShowLegend()"
						>
							<EllipsisIcon class="p-0" :size="20" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						{{ t("EntityPage.networkLegend") }}
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		</div>
	</aside>

	<Teleport to="#ego-network-legend">
		<div v-if="showLegend" class="absolute right-0 mr-2">
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
