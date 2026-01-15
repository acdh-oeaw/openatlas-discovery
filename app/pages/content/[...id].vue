<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";
import { useTemplateRef } from "vue";

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
	queryFn: async ({ queryKey: [, locale, ...id] }) => {
		const prefix = `contentPages/pages/${locale}/${id[0]}.md`;

		const fetchedContent = await queryCollection("contentPages").where("id", "=", prefix).first();
		return fetchedContent;
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

const contentRef = useTemplateRef("pageContent");
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

const isTocOpen = ref(false);

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
		<div class="mx-auto w-full min-w-0">
			<!-- Mobile TOC Toggle -->
			<div
				v-if="content?.toc && content?.body.toc && content.body.toc.links.length > 0"
				class="mb-4 lg:hidden"
			>
				<button
					class="text-sm font-semibold text-neutral-500 uppercase hover:text-neutral-700 dark:hover:text-neutral-300"
					@click="isTocOpen = !isTocOpen"
				>
					{{ t("ContentPage.table-of-contents") }} {{ isTocOpen ? "−" : "+" }}
				</button>
				<ol v-if="isTocOpen" ref="toc" class="mt-2 ml-0 text-xs text-neutral-500">
					<TocEntry
						v-for="link in content?.body.toc?.links"
						:key="link.id"
						:entry="link"
						:current-hash="currentHash"
					></TocEntry>
				</ol>
			</div>

			<div class="grid w-full grid-cols-1 gap-x-10 lg:grid-cols-[1fr_48rem_1fr]">
				<div class="hidden lg:block"></div>
				<div class="min-w-0">
					<div>
						<PageTitle>{{ content?.title }}</PageTitle>
					</div>
					<ContentRenderer
						v-if="content != null"
						ref="pageContent"
						class="prose w-full"
						:value="content.body"
					>
						<template #empty></template>
					</ContentRenderer>
				</div>
				<aside
					v-if="content?.toc && content?.body.toc && content.body.toc.links.length > 0"
					class="sticky top-24 hidden max-h-fit text-xs text-neutral-500 lg:block"
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
