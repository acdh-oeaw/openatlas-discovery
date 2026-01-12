<script lang="ts" setup>
import { noop } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";

const locale = useLocale();
const t = useTranslations();
const route = useRoute();

const id = computed(() => {
	const segments = route.path.split("/").filter(Boolean); // ["de", "imprint"]
	return segments[segments.length - 1];
});

const {
	data: content,
	error,
	suspense,
} = useQuery({
	queryKey: ["pages", locale, id] as const,
	queryFn: async ({ queryKey: [, locale, ...id] }) => {
		const prefix = `contentPages/pages/${locale}/${id[0]}.md`;
		const fetchedContent = await queryCollection("contentPages").where("id", "=", prefix).first();
		return fetchedContent;
	},
});
useErrorMessage(error, {
	notFound: t("ImprintPage.error.not-found"),
	unknown: t("ImprintPage.error.unknown"),
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
	<ContentRenderer v-if="content != null" class="prose" :value="content.body">
		<template #empty></template>
	</ContentRenderer>
</template>
