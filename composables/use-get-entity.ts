import { useQuery } from "@tanstack/vue-query";

import { type EntityFeature, useCreateEntity } from "@/composables/use-create-entity";
import { useCreateLinkedEntities } from "@/composables/use-create-linked-entities";
import type { operations } from "@/lib/api-client/api";
import type { LinkedPlace } from "@/types/api";

export interface GetEntityParams
	extends NonNullable<operations["GetEntity"]["parameters"]["path"]> {}

export interface GetLinkedEntitiesParams
	extends NonNullable<operations["GetEntitiesLinkedToEntity"]["parameters"]["path"]> {}

export type GetEntityResponse = LinkedPlace;

export function useGetEntity(params: MaybeRef<GetEntityParams>) {
	const api = useApiClient();
	const createEntity = useCreateEntity();
	const createLinkedEntities = useCreateLinkedEntities();

	return useQuery({
		queryKey: ["entity", params] as const,
		async queryFn({ queryKey, signal }) {
			const [, params] = queryKey;
			const typedParams: GetEntityParams = params as GetEntityParams;
			const _typedParams: GetLinkedEntitiesParams = params as GetLinkedEntitiesParams;

			// Start both API calls concurrently using Promise.all
			const [entityResponse, linkedEntitiesResponse] = await Promise.all([
				api.GET("/entity/{entityId}", {
					params: {
						path: {
							...typedParams,
						},
						query: {
							format: "lpx",
							centroid: true,
						},
					},
					signal,
				}),
				api.GET("/entities_linked_to_entity/{entityId}", {
					params: {
						path: {
							..._typedParams,
						},
						query: {
							format: "lpx",
							centroid: true,
							show: ["types"],
						},
					},
					signal,
				}),
			]);

			const entity = createEntity(entityResponse as GetEntityResponse);
			const linkedEntities = createLinkedEntities(
				linkedEntitiesResponse.results.filter((result): result is LinkedPlace => {
					return Array.isArray((result as LinkedPlace).features);
				}),
			);

			console.log("Entity", entity);

			if (entity.features[0] != null) {
				entity.features[0].relations = [...(entity.features[0].relations ?? []), ...linkedEntities];
			}

			console.log("LinkedEntites", linkedEntities);
			console.log("Entity with relations:", entity.features);
			return entity;
		},
	});
}
