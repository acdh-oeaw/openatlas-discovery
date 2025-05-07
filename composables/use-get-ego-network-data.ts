import { useQuery } from "@tanstack/vue-query";

import type { operations } from "@/lib/api-client/api";

export interface GetEgoNetworkDataParams
	extends NonNullable<operations["GetEgoNetworkVisualisation"]["parameters"]["query"]> {
	id: number;
}

export interface GetEgoNetworkDataResponse
	extends NonNullable<operations["GetEgoNetworkVisualisation"]["responses"]["200"]> {}

export function useGetEgoNetworkData(params: MaybeRef<GetEgoNetworkDataParams>) {
	const api = useApiClient();

	return useQuery({
		queryKey: ["ego-network-data", params] as const,
		async queryFn({ queryKey, signal }) {
			const [, params] = queryKey;

			const linked_to_ids = defaultFilterParams.type_id?.map((value) => {
				return value;
			});

			const response = await api.GET("/ego_network_visualisation/{entityId}", {
				params: {
					path: {
						entityId: params.id,
					},
					query: {
						...params,
						linked_to_ids,
					},
				},
				signal,
			});
			return response.results;
		},
	});
}
