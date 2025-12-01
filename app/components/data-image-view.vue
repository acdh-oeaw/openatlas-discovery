<script setup lang="ts">
import { miradorConfig } from "@/config/mirador.config";

const route = useRoute();

const image = computed(() => {
	return route.query.image as string;
});
</script>

<template>
	<div class="relative">
		<VisualisationContainer v-slot="{ height, width }">
			<LazyMiradorViewer
				v-if="height && width"
				id="miradorFullscreen"
				:images="[image ?? '']"
				:config="miradorConfig"
				:allow-maximize="false"
			/>
		</VisualisationContainer>
	</div>
</template>
