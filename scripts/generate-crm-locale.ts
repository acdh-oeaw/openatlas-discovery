/**
 * This script generates CRM messages for all locales specified in `i18n.config.ts`.
 * It fetches CRM types as well as their translations from the API and generates a JSON file for each locale.
 * To override the translations, add the custom translations to the `customDictionary` object.
 * The structure of the generated JSON files is as follows:
 * {
 *  "relationTypeCode": {
 * 		"title": "Title",
 * 		"titleInverse": "Inverse title",
 * 		"groupTitle": "Group title",
 * 		"groupTitleInverse": "Inverse group title"
 * }
 */

import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

import { log } from "@acdh-oeaw/lib";
import createApiClient from "@stefanprobst/openapi-client";
import { z } from "zod";

import { defaultLocale, locales } from "@/config/i18n.config";
import type { paths } from "@/lib/api-client/api";

const schema = z.object({
	NUXT_PUBLIC_API_BASE_URL: z.string().url(),
});

const result = schema.safeParse(process.env);

if (!result.success) {
	const message = "Invalid environment variables";
	log.error(`${message}:`, result.error.flatten().fieldErrors);
	const error = new Error(message);
	delete error.stack;
	throw error;
}

const baseUrl = result.data.NUXT_PUBLIC_API_BASE_URL;

interface Translations {
	title: string;
	titleInverse: string;
	groupTitle?: string;
	groupTitleInverse?: string;
}

const customDictionary: Record<string, Record<string, Partial<Translations>>> = {
	en: {
		P107: {
			title: "has Member(s)",
			titleInverse: "Member of",
			groupTitle: "Members",
		},
		P74: {
			title: "Residence",
		},
	},
	de: {
		P107: {
			title: "hat Mitglied(er)",
			titleInverse: "Mitglied bei",
			groupTitle: "Mitglieder",
		},
		P74: {
			title: "Residenz",
		},
	},
};

/**
 * Generates CRM messages for the specified locale.
 * @param locale - The locale for which to generate CRM messages. Defaults to `defaultLocale` if not provided.
 * @returns A Promise that resolves when the CRM messages have been generated.
 */
async function generate(locale = defaultLocale) {
	log.info(`Generating crm messages for locale: "${locale}" from url: ${baseUrl} ...`);
	const apiClient = createApiClient<paths>({ baseUrl });

	const crmTypes = await apiClient.GET("/properties/");

	const obj: Record<string, Translations> = {};

	for (const [key, type] of Object.entries(crmTypes)) {
		if (!type.code) continue;

		const customTitle = customDictionary[locale]?.[type.code]?.title;
		const customInverseTitle = customDictionary[locale]?.[type.code]?.titleInverse;
		const customGroupTitle = customDictionary[locale]?.[type.code]?.groupTitle;
		const customGroupInverseTitle = customDictionary[locale]?.[type.code]?.groupTitleInverse;

		const title = customTitle ?? type.i18n[locale] ?? type.i18n[defaultLocale];
		// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
		const inverseTitle =
			customInverseTitle ??
			//@ts-expect-error The type is not correct, its isn't a string
			type.i18nInverse[locale] ??
			//@ts-expect-error The type is not correct, its isn't a string
			type.i18nInverse[defaultLocale] ??
			title;

		const typeTranslations: Translations = {
			title: title ?? "TRANSLATION MISSING",
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			titleInverse: inverseTitle,
			groupTitle: customGroupTitle ?? title,
			// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
			groupTitleInverse: customGroupInverseTitle ?? inverseTitle,
		};

		obj[key] = typeTranslations;
	}

	const content = JSON.stringify(obj, null, "\t");

	const folderPath = join(process.cwd(), "messages", locale);
	await mkdir(folderPath, { recursive: true });
	await writeFile(join(folderPath, `crm.json`), content, {
		encoding: "utf-8",
	});
}

for (const locale of locales) {
	generate(locale)
		.then(() => {
			log.success(`Successfully generated crm messages for ${locale}.`);
		})
		.catch((error) => {
			log.error(`Failed to generate crm messages for ${locale}.\n`, String(error));
			process.exitCode = 1;
		});
}
