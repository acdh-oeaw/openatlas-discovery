import type { Feature, FeatureCollection, Geometry } from "geojson";

export function hasCoordinates(geometry: Feature | FeatureCollection | Geometry): boolean {
	if (geometry.type === "FeatureCollection") {
		return geometry.features.some((geometry) => {
			return hasCoordinates(geometry);
		});
	}
	return true;
}
