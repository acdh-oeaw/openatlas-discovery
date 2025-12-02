import { defaultLocale } from "../config/i18n.config";
import { defineI18nConfig } from "vue-i18n";

export default defineI18nConfig({
	fallbackLocale: defaultLocale,
	legacy: false,
	datetimeFormats: {
		en: {
			short: {
				year: "numeric",
				month: "short",
				day: "numeric",
			},
			long: {
				year: "numeric",
				month: "short",
				day: "numeric",
				weekday: "short",
				hour: "numeric",
				minute: "numeric",
			},
		},
		de: {
			short: {
				year: "numeric",
				month: "short",
				day: "numeric",
			},
			long: {
				year: "numeric",
				month: "short",
				day: "numeric",
				weekday: "short",
				hour: "numeric",
				minute: "numeric",
				hour12: true,
			},
		},
	},
});
