<script setup lang="ts">
import {
	BlocksIcon,
	CircleMinusIcon,
	CirclePauseIcon,
	CirclePlayIcon,
	CirclePlusIcon,
	DownloadIcon,
	ExpandIcon,
	RotateCcwIcon,
	ShrinkIcon,
} from "lucide-vue-next";
import { useTemplateRef } from "vue";

const t = useTranslations();

const props = defineProps<{
	layoutRunning: boolean | undefined;
	isFullscreen: boolean;
	showOrphans: boolean;
}>();

const emit = defineEmits(["networkControlEvent"]);

const containerRef = useTemplateRef<HTMLElement>("container");

function onClickControls(
	element:
		| "download"
		| "fullscreen"
		| "resetZoom"
		| "toggleOrphans"
		| "toggleRenderer"
		| "zoomIn"
		| "zoomOut",
) {
	emit("networkControlEvent", element);
}
</script>

<template>
	<aside
		ref="container"
		class="flex max-h-72 w-fit flex-row gap-2 overflow-y-auto overflow-x-hidden rounded-md border-2 border-transparent bg-white px-4 py-2 text-sm shadow-md"
	>
		{{ containerRef?.getAttribute("id") }}
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger>
					<Button variant="transparent" size="icon" @click="onClickControls('toggleRenderer')">
						<span class="sr-only">{{
							props.layoutRunning
								? t("NetworkPage.controls.pause")
								: t("NetworkPage.controls.start")
						}}</span>
						<component
							:is="props.layoutRunning ? CirclePauseIcon : CirclePlayIcon"
							:size="20"
							class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
						></component> </Button></TooltipTrigger
				><TooltipContent :container="containerRef ?? undefined">{{
					props.layoutRunning ? t("NetworkPage.controls.pause") : t("NetworkPage.controls.start")
				}}</TooltipContent></Tooltip
			>
			<div class="border-separate border" />
			<div>
				<Tooltip>
					<TooltipTrigger>
						<Button variant="transparent" size="icon" @click="onClickControls('zoomIn')">
							<span class="sr-only"> {{ t("NetworkPage.controls.zoomIn") }}</span>
							<CirclePlusIcon
								:size="20"
								class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
							/>
						</Button> </TooltipTrigger
					><TooltipContent :container="containerRef ?? undefined">{{
						t("NetworkPage.controls.zoomIn")
					}}</TooltipContent></Tooltip
				>
				<Tooltip>
					<TooltipTrigger>
						<Button variant="transparent" size="icon" @click="onClickControls('zoomOut')">
							<span class="sr-only"> {{ t("NetworkPage.controls.zoomOut") }}</span>
							<CircleMinusIcon
								:size="20"
								class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
							/> </Button></TooltipTrigger
					><TooltipContent :container="containerRef ?? undefined">{{
						t("NetworkPage.controls.zoomOut")
					}}</TooltipContent></Tooltip
				>
				<Tooltip>
					<TooltipTrigger>
						<Button variant="transparent" size="icon" @click="onClickControls('resetZoom')">
							<span class="sr-only"> {{ t("NetworkPage.controls.reset-zoom") }}</span>
							<RotateCcwIcon
								:size="20"
								class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
							/> </Button></TooltipTrigger
					><TooltipContent :container="containerRef ?? undefined">{{
						t("NetworkPage.controls.reset-zoom")
					}}</TooltipContent></Tooltip
				>
			</div>
			<div class="border-separate border" />
			<div class="self-center">
				<Tooltip>
					<TooltipTrigger>
						<Button
							variant="transparent"
							size="icon"
							:class="{ 'text-brand': props.showOrphans }"
							@click="onClickControls('toggleOrphans')"
						>
							<BlocksIcon
								:size="20"
								class="transition-opacity hover:opacity-100 focus-visible:opacity-100"
								:class="{ 'opacity-70': !props.showOrphans }"
							/>
							<span class="sr-only">{{
								showOrphans
									? t("NetworkPage.controls.hide-orphans")
									: t("NetworkPage.controls.show-orphans")
							}}</span>
						</Button>
					</TooltipTrigger>
					<TooltipContent :container="containerRef ?? undefined">{{
						showOrphans
							? t("NetworkPage.controls.hide-orphans")
							: t("NetworkPage.controls.show-orphans")
					}}</TooltipContent></Tooltip
				>
			</div>
			<div class="border-separate border" />
			<Tooltip>
				<TooltipTrigger>
					<Button variant="transparent" size="icon" @click="onClickControls('fullscreen')">
						<span class="sr-only">{{
							props.isFullscreen
								? t("NetworkPage.controls.reset-fullscreen")
								: t("NetworkPage.controls.fullscreen")
						}}</span>
						<component
							:is="props.isFullscreen ? ShrinkIcon : ExpandIcon"
							:size="20"
							class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
						></component> </Button
				></TooltipTrigger>
				<TooltipContent :container="containerRef ?? undefined">{{
					props.isFullscreen
						? t("NetworkPage.controls.reset-fullscreen")
						: t("NetworkPage.controls.fullscreen")
				}}</TooltipContent></Tooltip
			>
			<div class="border-separate border" />
			<Tooltip>
				<TooltipTrigger>
					<Button variant="transparent" size="icon" @click="onClickControls('download')">
						<span class="sr-only"> {{ t("NetworkPage.controls.download") }}</span>
						<DownloadIcon
							:size="20"
							class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
						/> </Button
				></TooltipTrigger>
				<TooltipContent :container="containerRef ?? undefined">{{
					t("NetworkPage.controls.download")
				}}</TooltipContent></Tooltip
			>
		</TooltipProvider>
	</aside>
</template>
