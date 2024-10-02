export function ensureTrailingSlash(url: string): string {
	return url.endsWith("/") ? url : `${url}/`;
}
