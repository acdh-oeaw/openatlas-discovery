import { log } from "@acdh-oeaw/lib";
import fs from "fs";

import { defaultLocale, locales } from "../app/config/i18n.config";

log.info("Generating prerender index");

const dir = "./.output/public/";

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
if (locales.length <= 1) {
	log.info("Single or no locales found, skipping reroute index generation");
} else {
	log.info("Multiple locales found, generating reroute index");
	const indexString = `<!DOCTYPE html>
	<html>
	<head>
		<meta http-equiv="refresh" content="0; url=/${defaultLocale}/">
	</head>
	</html>`;

	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}

	fs.writeFileSync(`${dir}/index.html`, indexString);

	log.success("Reroute index generated");
}
