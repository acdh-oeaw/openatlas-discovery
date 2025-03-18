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

const t = useTranslations();

const props = defineProps<{
	layoutRunning: boolean | undefined;
	isFullscreen: boolean;
	showOrphans: boolean;
}>();

const emit = defineEmits(["networkControlEvent"]);

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
		class="flex max-h-72 w-fit flex-row gap-2 overflow-y-auto overflow-x-hidden rounded-md border-2 border-transparent bg-white px-4 py-2 text-sm shadow-md"
	>
		<Button variant="transparent" size="icon" @click="onClickControls('toggleRenderer')">
			<span class="sr-only">{{
				props.layoutRunning ? t("NetworkPage.controls.pause") : t("NetworkPage.controls.start")
			}}</span>
			<component
				:is="props.layoutRunning ? CirclePauseIcon : CirclePlayIcon"
				:size="20"
				class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
			></component>
		</Button>
		<div class="border-separate border" />
		<div>
			<Button variant="transparent" size="icon" @click="onClickControls('zoomIn')">
				<span class="sr-only"> {{ t("NetworkPage.controls.zoomIn") }}</span>
				<CirclePlusIcon
					:size="20"
					class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
				/>
			</Button>
			<Button variant="transparent" size="icon" @click="onClickControls('zoomOut')">
				<span class="sr-only"> {{ t("NetworkPage.controls.zoomOut") }}</span>
				<CircleMinusIcon
					:size="20"
					class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
				/>
			</Button>
			<Button variant="transparent" size="icon" @click="onClickControls('resetZoom')">
				<span class="sr-only"> {{ t("NetworkPage.controls.reset-zoom") }}</span>
				<RotateCcwIcon
					:size="20"
					class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
				/>
			</Button>
		</div>
		<div class="border-separate border" />
		<div class="self-center">
			<TooltipProvider>
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
					<TooltipContent>{{
						showOrphans
							? t("NetworkPage.controls.hide-orphans")
							: t("NetworkPage.controls.show-orphans")
					}}</TooltipContent></Tooltip
				>
			</TooltipProvider>
		</div>
		<div class="border-separate border" />
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
			></component>
		</Button>
		<div class="border-separate border" />
		<Button variant="transparent" size="icon" @click="onClickControls('download')">
			<span class="sr-only"> {{ t("NetworkPage.controls.download") }}</span>
			<DownloadIcon
				:size="20"
				class="opacity-70 transition-opacity hover:opacity-100 focus-visible:opacity-100"
			/>
		</Button>
	</aside>
</template>
