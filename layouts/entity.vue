<script lang="ts" setup>
import { z } from "zod";
import { createUrl, isNonEmptyString } from "@acdh-oeaw/lib";
import type { WebSite, WithContext } from "schema-dts";

import { project } from "@/config/project.config";

const env = useRuntimeConfig();

const locale = useLocale();
const t = useTranslations();

const i18nHead = useLocaleHead({
	addDirAttribute: true,
	identifierAttribute: "id",
	addSeoAttributes: true,
});


const fullscreen = "--container-width: ;";
const container = "--container-width: 1536px;";

definePageMeta({
	layout: "default",
	validate(route) {
		const env = useRuntimeConfig();
		if (env.public.NUXT_PUBLIC_DATABASE === "disabled") return false;

		const paramsSchema = z.object({
			id: z.coerce.number().int().positive(),
		});
		return paramsSchema.safeParse(route.params).success;
	},
});

usePageMetadata({
	title: t("EntityPage.meta.title"),
});

const route = useRoute();
const id = computed(() => {
	console.log("route params", route.params)
	return Number(route.params.id as string);
});

const { data, isPending, isPlaceholderData } = useGetEntity(
	computed(() => {
		return { entityId: id.value };
	}),
);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entity = computed(() => {
	console.log("data", data.value)
	return data.value?.features[0];
});


useHead({
	htmlAttrs: {
		lang: computed(() => {
			return locale.value;
		}),
		// TODO: move to tailwind config
		style: `--color-brand: ${project.colors.brand}; --color-brand-foreground: ${project.colors.brandContrast};`,
	},
	titleTemplate: computed(() => {
		return ["%s", t("Metadata.name")].join(" | ");
	}),
	title: computed(() => {
		return entity.value?.properties.title ?? t("EntityPage.meta.title");
	}),
	link: computed(() => {
		return [
			{ href: "/favicon.ico", rel: "icon", sizes: "any" },
			{ href: "/icon.svg", rel: "icon", type: "image/svg+xml", sizes: "any" },
			{ href: "/apple-icon.png", rel: "apple-touch-icon" },
			{ href: "/manifest.webmanifest", rel: "manifest" },
			...(i18nHead.value.link ?? []),
		];
	}),
	meta: computed(() => {
		return [
			{ name: "description", content: t("Metadata.description") },
			{ property: "og:type", content: "website" },
			{ property: "og:title", content: t("Metadata.name") },
			{ property: "og:site_name", content: t("Metadata.name") },
			{ property: "og:description", content: t("Metadata.description") },
			{
				property: "og:image",
				content: String(
					createUrl({
						baseUrl: env.public.NUXT_PUBLIC_APP_BASE_URL,
						pathname: "/opengraph-image.png",
					}),
				),
			},
			{ name: "twitter:card", content: "summary_large_image" },
			...(isNonEmptyString(project.twitter)
				? [
						{ name: "twitter:creator", content: project.twitter },
						{ name: "twitter:site", content: project.twitter },
					]
				: []),
			...(i18nHead.value.meta ?? []),
		];
	}),
	script: computed(() => {
		const jsonLd: WithContext<WebSite> = {
			"@context": "https://schema.org",
			"@type": "WebSite",
			name: t("Metadata.name"),
			description: t("Metadata.description"),
		};

		const scripts = [
			{ type: "application/ld+json", innerHTML: JSON.stringify(jsonLd, safeJsonLdReplacer) },
		];

		if (
			isNonEmptyString(env.public.NUXT_PUBLIC_MATOMO_BASE_URL) &&
			isNonEmptyString(env.public.NUXT_PUBLIC_MATOMO_ID)
		) {
			const baseUrl = env.public.NUXT_PUBLIC_MATOMO_BASE_URL;

			scripts.push({
				type: "",
				innerHTML: createAnalyticsScript(
					baseUrl.endsWith("/") ? baseUrl : baseUrl + "/",
					env.public.NUXT_PUBLIC_MATOMO_ID,
				),
			});
		}

		return scripts;
	}),
});

</script>
<template>
	<div
		class="grid min-h-full grid-rows-[auto_1fr_auto]"
		:style="project.fullscreen ? fullscreen : container"
	>
		<SkipLink target-id="main-content">{{ t("DefaultLayout.skip-to-main-content") }}</SkipLink>

		<AppHeader />
		<ErrorBoundary>
				<template v-if="entity != null">
				<EntitySidebar :entity="entity" />
				</template>
				<template v-else-if="isLoading">
					<Centered class="pointer-events-none opacity-50">
						<LoadingIndicator />
					</Centered>
				</template>
				<slot />
		</ErrorBoundary>
		<AppFooter />

		<Toaster position="bottom-right" />
		<RouteAnnouncer />
	</div>
</template>
