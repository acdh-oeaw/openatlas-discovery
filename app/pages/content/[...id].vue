<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";
import { useTemplateRef } from "vue";

import type { ContentPage } from "@/types/content";
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
		return queryCollection("pages").path(route.path).first();
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

const contentRef = useTemplateRef("content");
const currentHash = ref<string | undefined>();
function updateHashUrl() {
	// eslint-disable-next-line  @typescript-eslint/ban-ts-comment
	// @ts-ignore
	if (!content.value || !contentRef.value?.$el?.querySelectorAll) return;
	// eslint-disable-next-line  @typescript-eslint/ban-ts-comment
	// @ts-ignore
	const sections = contentRef.value.$el.querySelectorAll("h2, h3, h4, h5, h6") ?? [];

	for (const section of sections) {
		const rect = section.getBoundingClientRect();
		if (rect.top > 0 && rect.top < 200) {
			currentHash.value = section.id ?? null;

			return;
		}
	}
}

watch(currentHash, () => {
	const location = window.location.toString().split("#")[0];
	if (location && currentHash.value)
		history.replaceState(null, "", `${location}#${currentHash.value}`);
});

onMounted(() => {
	document.body.addEventListener("scroll", updateHashUrl);
	updateHashUrl();
});
onUnmounted(() => {
	document.body.removeEventListener("scroll", updateHashUrl);
});
</script>

<template>
	<MainContent class="container w-full py-8">
		<div>
			<div class="mx-auto grid w-full grid-cols-1 gap-x-10 xl:grid-cols-[1fr_48rem_1fr]">
				<div></div>
				<div>
					<div>
						<PageTitle>{{ content?.title }}</PageTitle>
					</div>
					<ContentRenderer v-if="content != null" ref="content" class="prose" :value="content">
						<template #empty></template>
					</ContentRenderer>
				</div>
				<aside
					v-if="content?.toc && content?.body.toc && content.body.toc.links.length > 0"
					class="sticky top-24 hidden max-h-fit text-xs text-neutral-500 xl:block"
				>
					<h2 class="text-xs font-bold uppercase">{{ t("ContentPage.table-of-contents") }}</h2>
					<ol ref="toc" class="ml-0">
						<TocEntry
							v-for="link in content?.body.toc?.links"
							:key="link.id"
							:entry="link"
							:current-hash="currentHash"
						></TocEntry>
					</ol>
				</aside>
			</div>
		</div>
	</MainContent>
</template>
