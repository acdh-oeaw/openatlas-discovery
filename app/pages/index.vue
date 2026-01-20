<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import type { MDCRoot } from "@nuxtjs/mdc";
import { useQuery } from "@tanstack/vue-query";
import Autoplay from "embla-carousel-autoplay";

import { project } from "@/config/project.config";

const locale = useLocale();
const t = useTranslations();
const route = useRoute();
const env = useRuntimeConfig();

definePageMeta({
	layout: project.map.startPage ? "visualization" : "default",
	middleware: project.map.startPage ? ["database-check", "redirect-home"] : undefined,
});

usePageMetadata({
	title: t("IndexPage.meta.title"),
});

const images = [
	{
		url: "/assets/demo-carousel/map-movement.png",
		license: "CC BY 4.0 Johannes Preiser-Kapeller",
		link: "https://discover-mobyz.openatlas.eu/visualization?mode=map",
	},
	{
		url: "/assets/demo-carousel/map-icons3.png",
		license: "CC BY 4.0 Nicholas Melvani",
		link: "https://approaching-byzantium.openatlas.eu/visualization?mode=map",
	},
	{
		url: "/assets/demo-carousel/map-areas.png",
		license: "CC BY 4.0 Stefan Eichert",
		link: "https://frontend-demo-dev.openatlas.eu/visualization?mode=network",
	},
	{
		url: "/assets/demo-carousel/network.png",
		license: "CC BY 4.0 Zachary Chitwood",
		link: "https://discover-mamems.openatlas.eu/visualization?mode=network",
	},
	{
		url: "/assets/demo-carousel/network-relations.png",
		license: "CC BY 4.0 Nicholas Melvani",
		link: "https://approaching-byzantium.openatlas.eu/visualization?mode=network",
	},
];

const {
	data: content,
	error,
	suspense,
} = useQuery({
	queryKey: computed(() => ["systemPages", locale.value, "index"]),
	queryFn: async () => {
		const id = `systemPages/system-pages/${locale.value}/index.md`;
		const page = await queryCollection("systemPages").where("id", "=", id).first();

		if (page?.leadIn && typeof page.leadIn === "string") {
			const parsed = await parseMarkdown(page.leadIn);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			page.leadIn = parsed.body as any;
		}

		const _page = page as typeof page & { leadIn: MDCRoot };
		return _page ?? null;
	},
});

useErrorMessage(error, {
	notFound: t("IndexPage.error.not-found"),
	unknown: t("IndexPage.error.unknown"),
});
onServerPrefetch(async () => {
	/**
	 * Delegate errors to the client, to avoid displaying error page with status code 500.
	 *
	 * @see https://github.com/TanStack/query/issues/6606
	 * @see https://github.com/TanStack/query/issues/5976
	 */
	await suspense().catch(noop);
});

const currentMode = computed(() => {
	return route.query.mode;
});
</script>

<template>
	<MainContent class="container py-8">
		<h1 class="sr-only">
			{{ content?.title ?? t("IndexPage.meta.title") }}
		</h1>
		<div v-if="!project.map.startPage">
			<div v-if="content != null">
				<div v-if="content.title !== 'OpenAtlas Discovery'">
					<template v-if="content.leadIn != null">
						<div class="mx-auto grid w-full max-w-3xl place-items-center gap-8 sm:p-8 sm:py-16">
							<div>
								<NuxtImg
									v-if="content.image?.light != null"
									alt=""
									class="block h-80 w-full max-w-3xl object-contain dark:hidden"
									preload
									:src="content.image?.light"
								/>
								<NuxtImg
									v-if="content.image?.dark != null"
									alt=""
									class="hidden h-80 w-full max-w-3xl object-contain dark:block"
									preload
									:src="content.image?.dark"
								/>
							</div>
							<ContentRenderer
								v-if="content.leadIn != null"
								class="prose prose-lg max-w-3xl text-center text-balance"
								unwrap="string"
								:value="content.leadIn"
							>
								<template #empty></template>
							</ContentRenderer>

							<div v-if="env.public.database === 'enabled'">
								<div class="flex items-center gap-6">
									<Button
										v-for="(link, key) of content.links"
										:key="key"
										as-child
										variant="default"
									>
										<NavLink :href="link.href">
											{{ link.label }}
										</NavLink>
									</Button>
								</div>
							</div>
						</div>
					</template>

					<div class="mx-auto w-full max-w-3xl">
						<ContentRenderer class="prose w-full" :value="content.body">
							<template #empty></template>
						</ContentRenderer>
					</div>
				</div>
				<div v-else>
					<div class="mx-auto w-full max-w-full">
						<div class="grid min-w-0 grid-rows-[1fr_auto] lg:grid-cols-2 lg:grid-rows-1 lg:gap-16">
							<div class="grid min-w-0 gap-4 pb-4">
								<div>
									<NuxtImg
										v-if="content.image?.light != null"
										alt=""
										class="mb-4 block w-full max-w-3xl object-contain object-left lg:h-60 dark:hidden"
										preload
										:src="content.image?.light"
									/>
									<NuxtImg
										v-if="content.image?.dark != null"
										alt=""
										class="mb-4 hidden w-full max-w-3xl object-contain object-left lg:h-60 dark:block"
										preload
										:src="content.image?.dark"
									/>
								</div>
								<ContentRenderer
									v-if="content.leadIn != null"
									class="prose prose-lg"
									unwrap="string"
									:value="content.leadIn"
								>
									<template #empty></template>
								</ContentRenderer>

								<div v-if="env.public.database === 'enabled'">
									<div class="flex items-center gap-6">
										<Button
											v-for="(link, key) of content.links"
											:key="key"
											as-child
											variant="default"
										>
											<NavLink :href="link.href">
												{{ link.label }}
											</NavLink>
										</Button>
									</div>
								</div>

								<div class="mt-6 w-full border dark:border-foreground/40"></div>
								<div>
									<ContentRenderer
										class="prose prose-sm w-full max-w-3xl opacity-75"
										:value="content.body"
									>
										<template #empty></template>
									</ContentRenderer>
								</div>
							</div>
							<div class="min-w-0">
							<Carousel
								:opts="{ loop: true }"
								:plugins="[
									Autoplay({
										delay: 5000,
										stopOnMouseEnter: true,
										stopOnFocusIn: true,
										stopOnInteraction: false,
									}),
								]"
								class="relative flex h-100 w-full lg:size-full"
							>
								<CarouselPrevious
									aria-label="Previous slide"
									class="z-20 ml-14 bg-white opacity-90 dark:bg-black"
								/>
								<CarouselContent class="size-full">
									<CarouselItem v-for="(image, index) of images" :key="index" class="">
										<Card class="relative flex size-full">
											<figure class="relative grid size-full grid-rows-[1fr_auto] gap-y-1.5">
												<div class="relative flex size-full">
													<img alt="" class="absolute size-full object-cover" :src="image.url" />
												</div>
												<figcaption class="grid w-full grid-rows-2 place-items-center text-sm">
													<div>{{ image.license }}</div>
													<NavLink
														class="flex items-center text-center underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
														:external="true"
														:href="image.link"
														>{{ image.link }}</NavLink
													>
												</figcaption>
											</figure>
										</Card>
									</CarouselItem>
								</CarouselContent>
								<CarouselNext
									v-if="images.length > 1"
									aria-label="Next slide"
									class="z-20 mr-14 bg-white opacity-90 dark:bg-black"
								/>
							</Carousel>
						</div>
						</div>
					</div>
				</div>
			</div>
		</div>

		<template v-if="project.map.startPage">
			<div>
				<PageTitle class="sr-only">{{ t("MapPage.title") }}</PageTitle>
			</div>
			<ErrorBoundary>
				<DataMapView v-show="currentMode === 'map'" />
				<DataNetworkView v-show="currentMode === 'network'" />
				<DataView v-if="currentMode === 'table'" />
			</ErrorBoundary>
		</template>
	</MainContent>
</template>
