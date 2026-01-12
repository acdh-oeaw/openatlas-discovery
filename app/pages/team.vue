<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import type { MDCRoot } from "@nuxtjs/mdc";
import { useQuery } from "@tanstack/vue-query";

const locale = useLocale();
const t = useTranslations();

usePageMetadata({
	title: t("TeamPage.meta.title"),
});

const {
	data: content,
	error,
	suspense,
} = useQuery({
	queryKey: computed(() => ["systemPages", locale.value, "team"]),
	queryFn: async () => {
		const id = `systemPages/system-pages/${locale.value}/team.md`;
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
	notFound: t("TeamPage.error.not-found"),
	unknown: t("TeamPage.error.unknown"),
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
</script>

<template>
	<MainContent class="container py-8">
		<template v-if="content != null && content.leadIn != null">
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

				<ContentRenderer
					v-if="content.leadIn != null"
					class="prose prose-lg max-w-3xl text-center text-balance"
					:value="content.leadIn"
				>
					<template #empty></template>
				</ContentRenderer>

				<div class="flex items-center gap-6">
					<Button v-for="(link, key) of content.links" :key="key" as-child variant="default">
						<NavLink :href="link.href">
							{{ link.label }}
						</NavLink>
					</Button>
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
				class="mx-auto prose w-full max-w-3xl px-8"
				:value="content.body"
			>
				<template #empty></template>
			</ContentRenderer>
		</div>

		<section class="mx-auto w-full max-w-3xl p-8">
			<h2 class="sr-only">{{ t("TeamPage.team-members") }}</h2>
			<TeamMembersList />
		</section>
	</MainContent>
</template>
