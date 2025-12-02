import * as v from "valibot";

const viewSchema = v.fallback(v.picklist(["map", "network"]), "map");

export function useGetCurrentView() {
	const route = useRoute();

	return computed(() => {
		const view = v.parse(viewSchema, route.path.split("/").pop());
		return view;
	});
}
