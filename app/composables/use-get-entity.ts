import { useQuery } from "@tanstack/vue-query";

import type { operations, paths } from "@/lib/api-client/api";
import type { PresentationViewModel } from "@/types/api";

export interface GetEntityParams extends NonNullable<
	operations["GetEntity"]["parameters"]["path"]
> {}

export interface GetEntityQueryParams extends NonNullable<
	paths["/entity_presentation_view/{entityId}"]["get"]["parameters"]["query"]
> {}
export interface GetLinkedEntitiesParams extends NonNullable<
	operations["GetEntitiesLinkedToEntity"]["parameters"]["path"]
> {}

export type GetEntityResponse = PresentationViewModel;

export function useGetEntity(
	params: MaybeRef<GetEntityParams>,
	query: GetEntityQueryParams = { place_hierarchy: true },
) {
	const api = useApiClient();

	return useQuery({
		queryKey: ["entity", params, query] as const,
		async queryFn({ queryKey, signal }) {
			const [, params] = queryKey;
			const typedParams: GetEntityParams = params;
			const _typedParams: GetLinkedEntitiesParams = params;

			const entity = api.GET("/entity_presentation_view/{entityId}", {
				params: {
					path: {
						...typedParams,
					},
					query,
				},
				signal,
			});
			return entity;
		},
	});
}
