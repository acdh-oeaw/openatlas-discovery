<script lang="ts" setup>
import { useQuery } from "@tanstack/vue-query";

import type { NavLinkProps } from "@/components/nav-link.vue";
import { project } from "@/config/project.config";
import type { ContentPage } from "@/types/content";

const locale = useLocale();
const t = useTranslations();

const env = useRuntimeConfig();

const defaultLinks = computed<
	Record<"home" & (string & {}), { href: NavLinkProps["href"]; label: string }>
>(() => {
	if (env.public.database === "enabled") {
		return {
			home: {
				href: { path: "/" },
				label: t("AppHeader.links.home"),
			},
			map: {
				href: { path: "/visualization", query: { mode: "map" } },
				label: t("AppHeader.links.map"),
			},
			network: {
				href: { path: "/visualization", query: { mode: "network" } },
				label: t("AppHeader.links.network"),
			},
			data: {
				href: { path: "/visualization", query: { mode: "table" } },
				label: t("AppHeader.links.data"),
			},
			team: { href: { path: "/team" }, label: t("AppHeader.links.team") },
		};
	}
	return {
		home: {
			href: { path: "/" },
			label: t("AppHeader.links.home"),
		},
		team: { href: { path: "/team" }, label: t("AppHeader.links.team") },
	};
});

const { data: navigation } = useQuery<Array<ContentPage>>({
	queryKey: computed(() => ["contentNavigation", locale.value]),
	queryFn: async ({ queryKey: [, locale] }) => {
		const prefix = `/pages/${locale}`;
		const allNavigation = await queryCollectionNavigation("contentPages").where(
			"path",
			"LIKE",
			`${prefix}%`,
		);

		const excludedPaths = ["/", "/imprint"].map((p) => `${prefix}${p}`);

		return allNavigation.filter((page) => !excludedPaths.includes(page._path as string));
	},
});

const contentLinks = computed(() => {
	const pages = navigation.value?.[0]?.children?.[0]?.children ?? [];
	if (!pages || pages.length === 0) return {};

	const prefix = ["", "pages", locale.value].join("/");

	const linksObj: Record<string, { href: NavLinkProps["href"]; label: string }> = {};

	for (const link of pages) {
		if (typeof link.path !== "string" || typeof link.title !== "string") continue;
		linksObj[link.path] = {
			href: { path: `/content${link.path.slice(prefix.length)}` },
			label: link.title,
		};
	}
	return linksObj;
});

const links = computed(() => {
	return {
		...defaultLinks.value,
		...contentLinks.value,
	};
});
</script>

<template>
	<header class="border-b">
		<div class="container flex items-center gap-4 py-4">
			<NavLink class="flex shrink-0" :href="links.home.href">
				<span class="sr-only">{{ links.home.label }}</span>
				<NuxtImg
					alt=""
					class="mr-6 block h-18 w-44 object-contain lg:size-12 dark:hidden"
					preload
					:src="project.logos.light"
				/>
				<NuxtImg
					alt=""
					class="mr-6 hidden h-18 w-44 object-contain lg:size-12 dark:block"
					preload
					:src="project.logos.dark"
				/>
			</NavLink>

			<div class="flex flex-1 items-center justify-between gap-4">
				<div class="hidden lg:flex">
					<AppNavigationMenu :label="t('AppHeader.navigation-main')" :links="links" />
				</div>
				<div class="ml-auto flex items-center gap-4">
					<ColorSchemeSwitcher />
					<LocaleSwitcher v-if="locales.length > 1" />
					<nav :aria-label="t('AppHeader.navigation-main')" class="flex shrink-0 lg:hidden">
						<AppNavigationMobileMenu :title="t('AppHeader.navigation-menu')" :links="links" />
					</nav>
				</div>
			</div>
		</div>
	</header>
</template>
