<script lang="ts" setup>
import type { CarouselApi } from "@/components/ui/carousel";
import { Toggle } from "@/components/ui/toggle";

const props = defineProps<{
	images: Array<{
		id: number;
		IIIFManifest?: string;
		license?: string | null;
		mimetype?: string;
		title?: string;
		url?: string;
	}>;
	height: number;
	width: number;
}>();

const api = ref<CarouselApi>();
const current = ref(0);

const t = useTranslations();
const show = ref(false);

function toggleIIIF() {
	show.value = !show.value;
}

function setApi(val: CarouselApi) {
	api.value = val;
	api.value.scrollTo(current.value, true);
}

watch(api, (api) => {
	if (!api) return;

	current.value = api.selectedScrollSnap();

	api.on("select", () => {
		current.value = api.selectedScrollSnap();
	});
});

const currentImage = computed(() => {
	return props.images[current.value];
});
</script>

<template>
	<div :style="{ width: props.width + 'px', height: props.height + 'px' }">
		<Carousel v-if="!show" class="relative flex size-full" @init-api="setApi">
			<CarouselPrevious
				v-if="props.images.length > 1"
				class="z-20 ml-14 bg-white opacity-90 dark:bg-black"
			/>
			<CarouselContent class="size-full">
				<CarouselItem v-for="(image, index) of props.images" :key="index" class="">
					<Card class="relative flex size-full">
						<figure class="relative grid size-full grid-rows-[1fr_auto] gap-y-1.5">
							<div class="relative flex size-full">
								<img alt="" class="absolute size-full object-contain" :src="image.url" />
							</div>
							<figcaption class="justify-self-center">{{ image.license }}</figcaption>
						</figure>
					</Card>
				</CarouselItem>
			</CarouselContent>
			<CarouselNext
				v-if="props.images.length > 1"
				class="z-20 mr-14 bg-white opacity-90 dark:bg-black"
			/>
		</Carousel>
		<EntityMiradorViewer v-if="show && currentImage" :images="[currentImage]" />
		<Toggle variant="iiif" class="absolute right-0 bottom-0 z-10 m-4" @click="toggleIIIF">
			{{ t("EntityPage.iiif") }}
		</Toggle>
	</div>
</template>
