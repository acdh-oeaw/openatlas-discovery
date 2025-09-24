import { useQuery } from "@tanstack/vue-query";

export function useGetTypeDistribution() {
	const api = useApiClient();

	return useQuery({
		queryKey: ["types"] as const,
		async queryFn({ signal }) {
			const types = api.GET("/type_tree/", {
				signal,
			});

			return types;
		},
	});
}
