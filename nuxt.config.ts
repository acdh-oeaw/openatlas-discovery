import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";

import { defaultLocale, files } from "./app/config/i18n.config";

const baseUrl = process.env.NUXT_PUBLIC_APP_BASE_URL!;

export default defineNuxtConfig({
	alias: {
		"@": fileURLToPath(new URL("./app/", import.meta.url)),
		"~": fileURLToPath(new URL("./", import.meta.url)),
	},
	app: {
		layoutTransition: false,
		pageTransition: false,
	},
	colorMode: {
		classSuffix: "",
		dataValue: "ui-color-scheme",
	},
	compatibilityDate: "2025-01-01",
	components: [{ path: "components", extensions: [".vue"], pathPrefix: false }],
	content: {
		defaultLocale,
		locales: files,
		markdown: {
			toc: {
				depth: 5,
			},
		},
		types: true,
	},
	css: [
		"@fontsource-variable/inter/standard.css",
		"@fontsource-variable/inter/standard-italic.css",
		"@/styles/index.css",
	],
	devtools: {
		enabled: true,
	},
	eslint: {
		config: {
			autoInit: false,
			standalone: false,
		},
	},
	experimental: {
		defaults: {
			useAsyncData: {
				deep: false,
			},
			useFetch: {
				timeout: 250,
			},
		},
		inlineRouteRules: true,
	},
	/**
	 * FIXME: some dependency does not properly clean up,
	 * so the build hangs without this workaround.
	 *
	 * @see https://github.com/nuxt/cli/issues/169
	 */
	hooks: {
		close(nuxt) {
			if (!nuxt.options._prepare) {
				process.exit();
			}
		},
	},
	i18n: {
		baseUrl,
		defaultLocale,
		detectBrowserLanguage: {
			redirectOn: "root",
		},
		experimental: {
			typedOptionsAndMessages: "default",
		},
		langDir: "messages",
		locales: files,
		strategy: "prefix",
	},
	imports: {
		dirs: ["@/config/"],
	},
	modules: [
		"@nuxt/content",
		"@nuxt/eslint",
		"@nuxt/image",
		"@nuxtjs/color-mode",
		"@nuxtjs/i18n",
		"@vueuse/nuxt",
	],
	nitro: {
		compressPublicAssets: true,
		prerender: {
			crawlLinks: true,
			routes: ["/manifest.webmanifest", "/robots.txt", "/sitemap.xml"],
		},
	},
	runtimeConfig: {
		public: {
			apiBaseUrl: process.env.NUXT_PUBLIC_API_BASE_URL,
			appBaseUrl: process.env.NUXT_PUBLIC_APP_BASE_URL,
			bots: process.env.NUXT_PUBLIC_BOTS,
			database: process.env.NUXT_PUBLIC_DATABASE,
			googleSiteVerification: process.env.NUXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
			mapBaselayerUrlDark: process.env.NUXT_PUBLIC_MAP_BASELAYER_URL_DARK,
			mapBaselayerUrlLight: process.env.NUXT_PUBLIC_MAP_BASELAYER_URL_LIGHT,
			matomoBaseUrl: process.env.NUXT_PUBLIC_MATOMO_BASE_URL,
			matomoId: process.env.NUXT_PUBLIC_MATOMO_ID,
			openapiBaseUrl: process.env.NUXT_PUBLIC_OPENAPI_BASE_URL,
			redmineId: process.env.NUXT_PUBLIC_REDMINE_ID,
			specialImprint: process.env.NUXT_PUBLIC_SPECIAL_IMPRINT,
			currentGitTag: process.env.NUXT_PUBLIC_GIT_CURRENT_TAG,
		},
	},
	typescript: {
		shim: false,
		strict: true,
		// https://github.com/nuxt/nuxt/issues/14816#issuecomment-1484918081
		tsConfig: {
			compilerOptions: {
				baseUrl: ".",
				paths: {
					"@/*": ["./app/*"],
					"~/*": ["./*"],
				},
			},
			include: [
				"../*.config.ts",
				"../i18n/*.config.ts",
				"../e2e/**/*.ts",
				"../scripts/**/*.ts",
				"../server/**/*.ts",
			],
		},
	},
	vite: {
		plugins: [tailwindcss()],
		resolve: {
			alias: {
				/** Force Unovis (and your code) to use the modern d3-geo. */
				"@unovis/ts/node_modules/d3-geo": require.resolve("d3-geo"),
				"d3-geo": require.resolve("d3-geo"),
			},
		},
	},
});
