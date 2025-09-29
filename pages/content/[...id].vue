<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";

import type { ContentPage } from "@/types/content";

defineRouteRules({
	prerender: true,
});

const locale = useLocale();
const t = useTranslations();

usePageMetadata({
	title: t("ContentPage.meta.title"),
});

const route = useRoute();
const id = computed(() => {
	return route.params.id as Array<string>;
});

const {
	data: content,
	error,
	suspense,
} = useQuery({
	queryKey: ["pages", locale, ...id.value] as const,
	queryFn({ queryKey: [, locale, ...id] }) {
		return queryContent<ContentPage>("pages", locale, ...id).findOne();
	},
});
useErrorMessage(error, {
	notFound: t("ContentPage.error.not-found"),
	unknown: t("ContentPage.error.unknown"),
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

// @ts-expect-error Incorrect upstream types.
useContentHead(content);
</script>

<template>
	<MainContent class="container w-full py-8">
		<div>
			<div class="mx-auto grid w-full grid-cols-[1fr_48rem_1fr] gap-x-10">
				<div></div>
				<div>
					<div>
						<PageTitle>{{ content?.title }}</PageTitle>
					</div>
					<ContentRenderer v-if="content != null" class="prose" :value="content">
						<template #empty></template>
					</ContentRenderer>
				</div>
				<aside class="sticky top-24 max-h-screen text-sm text-neutral-500">
					<h2>Table of contents</h2>
					<ol class="ml-0">
						<TocEntry
							v-for="link in content?.body.toc?.links"
							:key="link.id"
							:entry="link"
						></TocEntry>
					</ol>
				</aside>
			</div>
		</div>
	</MainContent>
</template>
