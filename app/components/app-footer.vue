<script lang="ts" setup>
import { HeartIcon } from "lucide-vue-next";

import type { NavLinkProps } from "@/components/nav-link.vue";
import { project } from "@/config/project.config";

const t = useTranslations();
const env = useRuntimeConfig();

const links = computed(() => {
	if (project.imprint === "none") return null;

	return {
		imprint: { href: { path: "/imprint" }, label: t("AppFooter.links.imprint") },
	} satisfies Record<string, { href: NavLinkProps["href"]; label: string }>;
});

const logos = project.footer.partner_logos;
</script>

<template>
	<footer class="w-full border-t pt-4 opacity-80">
		<div
			:class="[
				!project.map.startPage
					? `grid items-start gap-4 text-sm lg:container lg:items-center lg:py-6`
					: `grid gap-4 p-0 text-sm lg:items-center lg:px-8 lg:py-6`,

				logos && logos.length > 0 ? 'sm:grid-cols-3' : 'sm:grid-cols-2',
			]"
		>
			<div class="sm:justify-self-start">
				<I18nT keypath="AppFooter.with-love">
					<HeartIcon class="inline-flex size-5" />
					<a
						class="decoration-dotted underline-offset-4 hover:underline focus-visible:underline"
						href="https://openatlas.eu"
					>
						OpenAtlas
					</a>
				</I18nT>
			</div>

			<nav
				:aria-label="t('AppFooter.navigation-secondary')"
				:class="logos?.length > 0 ? 'sm:justify-self-center' : 'sm:justify-self-end'"
			>
				<ul class="flex items-center gap-6" role="list">
					<li v-for="(link, key) of links" :key="key">
						<span
							v-if="link.href.path === '/imprint' && env.public.currentGitTag"
							class="inline-flex gap-1"
						>
							<span>{{ t("AppFooter.version-number") }}</span>
							<NavLink
								href="https://redmine.openatlas.eu/projects/openatlas-discovery/roadmap"
								target="_blank"
								external
								class="mr-2 decoration-dotted underline-offset-4 hover:underline focus-visible:underline"
								>{{ env.public.currentGitTag ?? t("AppFooter.no-version") }}</NavLink
							>
							<span class="mr-2">|</span>
						</span>
						<NavLink
							class="decoration-dotted underline-offset-4 hover:underline focus-visible:underline"
							:href="link.href"
						>
							{{ link.label }}
						</NavLink>
					</li>
				</ul>
			</nav>

			<div v-if="logos && logos.length > 0" class="flex gap-7 lg:-my-2 lg:ml-auto">
				<NuxtLink
					v-for="logo in logos"
					:key="logo.name"
					:to="logo.url"
					external
					target="_blank"
					class="grayscale transition-all duration-500 hover:grayscale-0"
				>
					<span class="sr-only">{{ logo.name }}</span>
					<NuxtImg
						:src="logo.light"
						class="block h-8 w-auto object-contain dark:hidden"
						alt=""
						preload
					/>
					<NuxtImg
						:src="logo.dark ?? logo.light"
						class="hidden h-8 w-auto object-contain dark:block"
						alt=""
						preload
					/>
				</NuxtLink>
			</div>
		</div>
	</footer>
</template>
