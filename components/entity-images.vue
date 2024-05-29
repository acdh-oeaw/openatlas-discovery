<script lang="ts" setup>
import { Toggle } from "@/components/ui/toggle";

const props = defineProps<{
	images: Array<{
		IIIFManifest: string | undefined;
		license: string | undefined;
		mimetype?: string | undefined;
		title?: string | undefined;
		url?: string | undefined;
	}>;
}>();

const t = useTranslations();
let show = ref(false);

function toggleIIIF() {
	show.value = !show.value;
}
</script>

<template>
	<Toggle class="absolute z-10 m-2" @click="toggleIIIF">
		{{ t("EntityPage.iiif") }}
	</Toggle>
	<Carousel v-if="!show">
		<CarouselPrevious v-if="props.images.length > 2" />
		<CarouselContent>
			<CarouselItem v-for="(image, index) of props.images" :key="index" class="h-full">
				<Card class="pb-3">
					<figure class="grid h-96 grid-rows-[1fr_auto] gap-y-1.5 overflow-hidden">
						<div class="relative">
							<img alt="" class="absolute size-full object-contain" :src="image.url" />
						</div>
						<figcaption class="justify-self-center">{{ image.license }}</figcaption>
					</figure>
				</Card>
			</CarouselItem>
		</CarouselContent>
		<CarouselNext v-if="props.images.length > 2" />
	</Carousel>
	<EntityMiradorViewer v-if="show" :images="props.images" />
</template>
