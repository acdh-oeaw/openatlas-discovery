import { includes } from "@acdh-oeaw/lib";
import type { LocaleObject } from "vue-i18n-routing";

import type de from "~/i18n/messages/de/common.json";
import type projectDe from "~/i18n/messages/de/project.json";
import type en from "~/i18n/messages/en/common.json";
import type projectEn from "~/i18n/messages/en/project.json";

import { project } from "./project.config";

export const locales = ["de", "en"] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = project.defaultLocale;

export const files = [
	{
		code: "de" as const,
		language: "de",
		files: ["de/common.json", "de/project.json", "de/crm.json"],
	},
	{
		code: "en" as const,
		language: "en",
		files: ["en/common.json", "en/project.json", "en/crm.json"],
	},
] satisfies Array<LocaleObject>;

export type Messages = typeof en & typeof projectEn;

export interface Schema {
	message: Messages;
}

export function isValidLocale(value: string): value is Locale {
	return includes(locales, value);
}

export interface Translations extends Record<Locale, Messages> {
	de: typeof de & typeof projectDe;
	en: typeof en & typeof projectEn;
}
