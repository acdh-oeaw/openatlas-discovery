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
	SettingsIcon,
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
	<div class="relative z-30">
		<Popover>
			<PopoverTrigger class="rounded-md bg-white/90 shadow-md dark:bg-neutral-900/90">
				<Button variant="ghost" size="icon">
					<SettingsIcon :size="20" />
					<span class="sr-only">{{ t("NetworkPage.controls.title") }}</span>
				</Button>
			</PopoverTrigger>

			<PopoverContent class="content-fit mr-2 space-y-2 p-2">
				<Button
					variant="ghost"
					size="icon"
					class="w-full justify-start"
					@click="onClickControls('toggleRenderer')"
				>
					<component :is="props.layoutRunning ? CirclePauseIcon : CirclePlayIcon" :size="20" />
					<span class="ml-2">
						{{
							props.layoutRunning
								? t("NetworkPage.controls.pause")
								: t("NetworkPage.controls.start")
						}}
					</span>
				</Button>

				<Button
					variant="ghost"
					class="w-full justify-start"
					size="icon"
					@click="onClickControls('zoomIn')"
				>
					<CirclePlusIcon :size="20" />
					<span class="ml-2">{{ t("NetworkPage.controls.zoomIn") }}</span>
				</Button>
				<Button
					variant="ghost"
					class="w-full justify-start"
					size="icon"
					@click="onClickControls('zoomOut')"
				>
					<CircleMinusIcon :size="20" />
					<span class="ml-2">{{ t("NetworkPage.controls.zoomOut") }}</span>
				</Button>
				<Button
					variant="ghost"
					class="w-full justify-start"
					size="icon"
					@click="onClickControls('resetZoom')"
				>
					<RotateCcwIcon :size="20" />
					<span class="ml-2">{{ t("NetworkPage.controls.reset-zoom") }}</span>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					class="w-full justify-start"
					@click="onClickControls('toggleOrphans')"
				>
					<BlocksIcon :size="20" />
					<span class="ml-2">
						{{
							props.showOrphans
								? t("NetworkPage.controls.hide-orphans")
								: t("NetworkPage.controls.show-orphans")
						}}
					</span>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					class="w-full justify-start"
					@click="onClickControls('fullscreen')"
				>
					<component :is="props.isFullscreen ? ShrinkIcon : ExpandIcon" :size="20" />
					<span class="ml-2">
						{{
							props.isFullscreen
								? t("NetworkPage.controls.reset-fullscreen")
								: t("NetworkPage.controls.fullscreen")
						}}
					</span>
				</Button>

				<Button
					variant="ghost"
					size="icon"
					class="w-full justify-start"
					@click="onClickControls('download')"
				>
					<DownloadIcon :size="20" />
					<span class="ml-2">{{ t("NetworkPage.controls.download") }}</span>
				</Button>
			</PopoverContent>
		</Popover>
	</div>
</template>
