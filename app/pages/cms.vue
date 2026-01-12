<script lang="ts" setup>
import { noop, useQuery } from "@tanstack/vue-query";

const locale = useLocale();
const t = useTranslations();

const {
	data: content,
	error,
	suspense,
} = useQuery({
	queryKey: ["cms-intro", locale, "intro"] as const,
	async queryFn({ queryKey: [, locale] }) {
		const id = `cmsIntro/cms-intro/${locale}/intro.md`;

		const fetchedContent = await queryCollection("cmsIntro").where("id", "=", id).first();
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

useHead({
	meta: [{ name: "robots", content: "noindex" }],
});
</script>

<template>
	<MainContent class="container py-8">
		<template v-if="content != null">
			<div class="grid place-items-center gap-8 p-8 sm:py-16">
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

				<div>
					<ContentRenderer
						v-if="content != null"
						class="mx-auto prose w-full max-w-3xl text-center"
						:value="content"
					>
						<template #empty></template>
					</ContentRenderer>
				</div>
				<div class="flex items-center gap-6">
					<Button v-for="(link, key) of content.links" :key="key" as-child variant="default">
						<NavLink :href="link.href" :external="link.external">
							{{ link.label }}
						</NavLink>
					</Button>
				</div>
			</div>
		</template>
	</MainContent>
</template>
