export function normalizeIsoYear(dateString: string) {
	return dateString
		.replace(/^-(\d{1,4})/, (_, year: string) => {
			return year.padStart(4, "0");
		})
		.trimEnd();
}

export function createDateSpan(date: { earliest?: string | null; latest?: string | null }) {
	const { d } = useNuxtApp().$i18n;
	const segments: Array<string> = [];
	if (date.earliest != null) {
		let dateValue: Date | string = date.earliest;
		let isBC = false;
		if (date.earliest.startsWith("-")) {
			dateValue = new Date(Date.parse(normalizeIsoYear(date.earliest)));
			dateValue.setFullYear(dateValue.getFullYear() * -1);
			isBC = true;
		}
		if (date.earliest === date.latest) {
			return d(dateValue, { dateStyle: "long" });
		}
		segments.push(d(dateValue, { dateStyle: "medium" }) + (isBC ? " BC" : ""));
	}
	if (date.latest != null) {
		let latestDateValue: Date | string = date.latest;
		let isBC = false;
		if (date.latest.startsWith("-")) {
			latestDateValue = new Date(Date.parse(normalizeIsoYear(date.latest)));
			latestDateValue.setFullYear(latestDateValue.getFullYear() * -1);
			isBC = true;
		}
		segments.push(d(latestDateValue, { dateStyle: "medium" }) + (isBC ? " BC" : ""));
	}

	return segments.join(" - ");
}
