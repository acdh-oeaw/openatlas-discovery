<script lang="ts" setup>
import { miradorConfig } from "@/config/mirador.config";

const route = useRoute();

const props = defineProps<{
	images: Array<{
		id: number;
		IIIFManifest?: string;
		license?: string | null;
		mimetype?: string;
		title?: string;
		url?: string;
	}>;
}>();

const imageUrls = computed(() => {
	const imageUrls: Array<string> = [];

	props.images.forEach((url) => {
		if (url.IIIFManifest != null) {
			imageUrls.push(url.IIIFManifest);
		}
	});

	return imageUrls;
});

const { hasVisited } = useInitialVisit();
</script>

<template>
	<Card class="h-96 overflow-hidden">
		<VisualisationContainer v-slot="{ height, width }">
			<LazyMiradorViewer
				v-if="height && width"
				id="entityMirador"
				:config="miradorConfig"
				:images="imageUrls"
				:allow-maximize="hasVisited >= 2 || route.query.mode != 'images'"
			/>
		</VisualisationContainer>
	</Card>
</template>
