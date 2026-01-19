<script setup lang="ts">
import { EllipsisIcon } from "lucide-vue-next";

const t = useTranslations();
const props = defineProps<{
	movements: Array<CustomGeoJsonFeature>;
	areas: Array<CustomGeoJsonFeature>;
	locations: Array<CustomGeoJsonFeature>;
	isMobile: boolean;
}>();

const emit = defineEmits<{
	(event: "toggle-polygons"): void;
}>();
</script>

<template>
	<div class="absolute right-0 bottom-0 z-10 mb-2 flex justify-end lg:w-full lg:justify-center">
		<div
			v-if="!props.isMobile"
			class="max-h-72 gap-2 overflow-x-hidden overflow-y-auto rounded-md border-2 border-transparent bg-white/90 p-2 text-sm font-medium shadow-md dark:bg-neutral-900"
		>
			<div class="grid grid-cols-[auto_auto_auto_auto] items-center gap-3 align-middle">
				<div class="grid grid-cols-[auto_1fr] gap-1">
					<span
						class="m-1.5 size-2 rounded-full"
						:style="`background-color: ${project.colors.geojsonPoints}`"
					></span>
					{{ $t("DataMapView.point") }} ({{ props.locations.length }})
				</div>
				<div class="grid grid-cols-[auto_1fr] gap-1">
					<span
						class="m-1.5 size-2 rounded-full"
						:style="`background-color: ${project.colors.geojsonAreaCenterPoints}`"
					></span>
					{{ $t("DataMapView.centerpoint") }} ({{ props.areas.length }})
				</div>
				<div class="grid grid-cols-[auto_1fr] gap-1">
					<span
						class="m-1.5 size-2 rounded-full"
						:style="`background-color: ${project.colors.geojsonMovement}`"
					></span>
					{{ $t("DataMapView.movement") }} ({{ props.movements.length }})
				</div>
				<div>
					<Toggle variant="iiif" @click="emit('toggle-polygons')">
						{{ $t("DataMapView.polygon") }}
					</Toggle>
				</div>
			</div>
		</div>
		<div v-if="props.isMobile" class="p-2">
			<Popover>
				<PopoverTrigger as-child class="bg-white/90 shadow-md dark:bg-neutral-900/90">
					<Button variant="ghost" size="icon">
						<EllipsisIcon :size="20" />
						<span class="sr-only">{{ t("MapPage.mapLegend") }}</span>
					</Button>
				</PopoverTrigger>

				<PopoverContent
					side="top"
					class="mr-2 max-h-64 w-fit space-y-2 overflow-y-auto p-2 text-sm"
				>
					<div class="grid grid-cols-[auto_1fr] gap-1">
						<span
							class="m-1.5 size-2 rounded-full"
							:style="`background-color: ${project.colors.geojsonPoints}`"
						></span>
						{{ $t("DataMapView.point") }} ({{ props.locations.length }})
					</div>
					<div class="grid grid-cols-[auto_1fr] gap-1">
						<span
							class="m-1.5 size-2 rounded-full"
							:style="`background-color: ${project.colors.geojsonAreaCenterPoints}`"
						></span>
						{{ $t("DataMapView.centerpoint") }} ({{ props.areas.length }})
					</div>
					<div class="grid grid-cols-[auto_1fr] gap-1">
						<span
							class="m-1.5 size-2 rounded-full"
							:style="`background-color: ${project.colors.geojsonMovement}`"
						></span>
						{{ $t("DataMapView.movement") }} ({{ props.movements.length }})
					</div>
					<div>
						<Toggle variant="iiif" @click="emit('toggle-polygons')">
							{{ $t("DataMapView.polygon") }}
						</Toggle>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	</div>
</template>
