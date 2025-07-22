import { useQuery } from "@tanstack/vue-query";

import type { components } from "@/lib/api-client/api";

export type GetSystemClassCountResponse = components["schemas"]["SystemClassCountModel"];

export function useGetSystemClassCount() {
	const api = useApiClient();

	return useQuery({
		queryKey: ["system_class_count"] as const,

		async queryFn({ signal }) {
			const response = await api.GET("/system_class_count/", {
				signal,
			});

			return response;
		},
	});
}
