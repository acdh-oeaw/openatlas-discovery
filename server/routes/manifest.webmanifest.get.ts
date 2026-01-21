import { createI18n } from "vue-i18n";

import de from "~/i18n/messages/de/common.json";
import projectDe from "~/i18n/messages/de/project.json";

const locale = "de";

const { t } = createI18n({
	legacy: false,
	locale,
	messages: { de: { ...de, ...projectDe } },
}).global;

const manifest = {
	name: t("Metadata.name"),
	short_name: t("Metadata.shortName"),
	description: t("Metadata.description"),
	start_url: "/",
	display: "standalone",
	background_color: "#fff",
	theme_color: "#fff",
	icons: [
		{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
		{ src: "/icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
		{ src: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
		{ src: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
	],
};

export default defineEventHandler((event) => {
	defaultContentType(event, "application/manifest+json");
	return manifest;
});
