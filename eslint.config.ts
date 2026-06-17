import * as path from "node:path";

import baseConfig from "@acdh-oeaw/eslint-config";
import nodeConfig from "@acdh-oeaw/eslint-config-node";
import nuxtConfig from "@acdh-oeaw/eslint-config-nuxt";
import playwrightConfig from "@acdh-oeaw/eslint-config-playwright";
import tailwindcssConfig from "@acdh-oeaw/eslint-config-tailwindcss";
import vueConfig from "@acdh-oeaw/eslint-config-vue";
import tanstackQueryPlugin from "@tanstack/eslint-plugin-query";
import { defineConfig, globalIgnores } from "eslint/config";
import gitignore from "eslint-config-flat-gitignore";

import { withNuxt } from "./.nuxt/eslint.config.mjs";

const configs = defineConfig(
	gitignore({ strict: false }),
	globalIgnores(["content/**", "public/**", "app/lib/api-client/api.ts"]),
	baseConfig,
	vueConfig,
	nuxtConfig,
	{
		name: "tailwindcss-config",
		extends: [tailwindcssConfig],
		rules: {
			"better-tailwindcss/no-unknown-classes": ["error", { ignore: ["lead", "not-richtext", "not-prose", "toaster"] }],
		},
		settings: {
			"better-tailwindcss": {
				entryPoint: path.resolve("./app/styles/index.css"),
			},
		},
	},
	playwrightConfig,
	// {
	// 	files: ["**/*.vue"],
	// 	rules: {
	// 		"vue/attributes-order": ["warn", { alphabetical: true }],
	// 	},
	// },
	tanstackQueryPlugin.configs["flat/recommended"],
	{
		files: ["server/**/*.ts"],
		extends: [nodeConfig],
	},
);

export default withNuxt(configs);
