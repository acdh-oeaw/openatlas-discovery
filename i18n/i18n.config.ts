import { defaultLocale } from "@/config/i18n.config";

export default defineI18nConfig(() => {
	return {
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
	};
});
