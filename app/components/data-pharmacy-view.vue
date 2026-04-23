<script setup lang="ts">
import { ExpandIcon, ShrinkIcon } from "lucide-vue-next";

const isFullscreen = ref(false);
const screenRef = ref<HTMLElement | null>(null);

const toggleFullscreen = () => {
	const el = screenRef.value!;

	if (!document.fullscreenElement) {
		el.requestFullscreen();
		isFullscreen.value = true;
	} else {
		document.exitFullscreen();
		isFullscreen.value = false;
	}
};
</script>
<template>
	<div class="relative h-full" ref="screenRef">
		<Button
			size="icon"
			class="absolute z-5 right-0 m-5 bg-white hover:bg-neutral-200"
			@click="toggleFullscreen"
		>
			<ExpandIcon v-if="!isFullscreen" class="text-black/90" />
			<ShrinkIcon v-else class="text-black/90" />
		</Button>
		<VisualisationContainer v-slot="{ height, width }">
			<PharmacyViewer v-if="height && width" />
		</VisualisationContainer>
	</div>
</template>
