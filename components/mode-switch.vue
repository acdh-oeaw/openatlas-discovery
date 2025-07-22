<script lang="ts" setup>
import {
	CircleOffIcon,
	MapPinIcon,
	MapPinOffIcon,
	RadiusIcon,
	TablePropertiesIcon,
} from "lucide-vue-next";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { project } from "@/config/project.config";
import type { PresentationViewModel } from "@/types/api";

const props = defineProps<{
	currentMode: string;
	id: number | null;
}>();

const t = useTranslations();

const route = useRoute();

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

let hasPlace = ref(true);
let inNetwork = ref(true);

const { data } = useGetEntity(
	computed(() => {
		return { entityId: Number(props.id) };
	}),
);

watch(
	() => {
		return data;
	},
	() => {
		const entity = data.value;
		if (entity) {
			entityHasCoordinates(entity);
			entityInNetwork(entity);
		}
	},
	{ immediate: true, deep: true },
);

function entityHasCoordinates(entity: PresentationViewModel) {
	if (!project.map.mapDisplayedSystemClasses.includes(entity.systemClass)) {
		hasPlace.value = false;
	}
	if (project.map.mapDisplayedSystemClasses.includes(entity.systemClass)) {
		if (
			entity.geometries == null ||
			entity.geometries.type ===
				"FeatureCollection" /* && entity.geometries.geometries.length === 0 */
		) {
			hasPlace.value = false;
		} else if (entity.geometries.geometry?.coordinates.length === 0) {
			hasPlace.value = false;
		} else hasPlace.value = true;
	}
}

function entityInNetwork(entity: PresentationViewModel) {
	if (project.network.excludeSystemClasses.includes(entity.systemClass)) {
		inNetwork.value = false;
	} else inNetwork.value = true;
}
</script>

<template>
	<div id="modeSwitch" class="flex w-fit flex-row gap-1.5 rounded-md p-2">
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger :style="{ cursor: inNetwork ? 'pointer' : 'auto' }">
					<div
						:class="
							props.currentMode === 'map'
								? 'bg-brand/90 text-white hover:bg-brand/90 p-1.5 rounded-md'
								: !hasPlace
									? 'rounded-md text-neutral-300 p-2'
									: 'hover:bg-accent hover:text-accent-foreground rounded-md p-2 text-black dark:text-white'
						"
					>
						<NavLink
							v-if="hasPlace"
							class="flex items-center gap-1 underline decoration-dotted hover:no-underline"
							:href="{
								path: `/${getPath()}`,
								query: {
									mode: 'map',
									...(props.id && { selection: props.id }),
								},
							}"
						>
							<MapPinIcon :size="16" />
						</NavLink>
						<MapPinOffIcon v-if="!hasPlace" :size="16" />
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p v-if="hasPlace">{{ t("EntityPage.map") }}</p>
					<p v-if="!hasPlace && props.id">{{ t("EntityPage.no-map") }}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger :style="{ cursor: inNetwork ? 'pointer' : 'auto' }">
					<div
						:class="
							props.currentMode === 'network'
								? 'bg-brand/90 text-white hover:bg-brand/90 p-1.5 rounded-md'
								: !inNetwork
									? 'rounded-md text-neutral-300 p-2'
									: 'hover:bg-accent hover:text-accent-foreground rounded-md p-2 text-black dark:text-white'
						"
					>
						<NavLink
							v-if="inNetwork"
							class="flex items-center gap-1 underline decoration-dotted hover:no-underline"
							:href="{
								path: `/${getPath()}`,
								query: {
									mode: 'network',
									...(props.id && { selection: props.id }),
								},
							}"
						>
							<RadiusIcon :size="16" />
						</NavLink>
						<CircleOffIcon v-if="!inNetwork" :size="16" />
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p v-if="inNetwork">{{ t("EntityPage.network") }}</p>
					<p v-if="!inNetwork">{{ t("EntityPage.no-network") }}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>
					<div
						:class="
							props.currentMode === 'table'
								? 'bg-brand/90 text-white hover:bg-brand/90 p-1.5 rounded-md'
								: 'hover:bg-accent hover:text-accent-foreground rounded-md p-2 text-black dark:text-white'
						"
					>
						<NavLink
							class="flex items-center gap-1 underline decoration-dotted hover:no-underline"
							:href="{
								path: `/${getPath()}`,
								query: {
									mode: 'table',
									...(props.id && { selection: props.id }),
								},
							}"
						>
							<TablePropertiesIcon :size="16" />
						</NavLink>
					</div>
				</TooltipTrigger>
				<TooltipContent>
					<p>{{ t("DataPage.title") }}</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	</div>
</template>
