<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";

import { project } from "@/config/project.config";
import type { SystemPage } from "@/types/content";

defineRouteRules({
	prerender: true,
});

const locale = useLocale();
const t = useTranslations();
const route = useRoute();
const router = useRouter();

const env = useRuntimeConfig();

onMounted(() => {
	if (project.map.startPage) {
		if (!route.query.mode) {
			return router.push({ query: { mode: "map" } });
		}
		return null;
	}
	return null;
});

definePageMeta({
	layout: project.map.startPage ? "visualization" : "default",
	middleware: project.map.startPage ? "database-check" : undefined,
});

usePageMetadata({
	title: t("IndexPage.meta.title"),
});

const {
	data: content,
	error,
	suspense,
} = useQuery({
	queryKey: ["system-pages", locale, "index"] as const,
	queryFn({ queryKey: [, locale] }) {
		return queryContent<SystemPage>("system-pages", locale).findOne();
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
	<MainContent class="grid grid-rows-[auto_1fr]">
		<div v-if="!project.map.startPage">
			<template v-if="content != null && content.leadIn != null">
				<div class="container grid place-items-center gap-8 p-8 sm:py-16">
					<div>
						<h1 class="sr-only">{{ content.title }}</h1>
						<NuxtImg
							v-if="content.image?.light != null"
							alt=""
							class="block h-80 w-full max-w-3xl object-contain dark:hidden"
							preload
							:src="content.image?.light"
							:width="768"
							:height="320"
						/>
						<NuxtImg
							v-if="content.image?.dark != null"
							alt=""
							class="hidden h-80 w-full max-w-3xl object-contain dark:block"
							preload
							:src="content.image?.dark"
							:width="768"
							:height="320"
						/>
					</div>

					<ContentRenderer
						v-if="content.leadIn != null"
						class="prose prose-lg max-w-3xl text-balance text-center"
						:value="content.leadIn"
					>
						<template #empty></template>
					</ContentRenderer>

					<div v-if="env.public.database === 'enabled'">
						<div class="flex items-center gap-6">
							<Button v-for="(link, key) of content.links" :key="key" as-child variant="default">
								<NavLink :href="link.href">
									{{ link.label }}
								</NavLink>
							</Button>
						</div>
					</div>
				</div>
			</template>

			<template v-else-if="content != null">
				<div class="mx-auto w-full max-w-3xl px-8">
					<PageTitle>{{ content?.title }}</PageTitle>
				</div>
			</template>

			<div>
				<ContentRenderer
					v-if="content != null"
					class="prose mx-auto w-full max-w-3xl"
					:value="content"
				>
					<template #empty></template>
				</ContentRenderer>
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
