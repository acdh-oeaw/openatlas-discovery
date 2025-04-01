import type { HttpError } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";

import type { operations } from "@/lib/api-client/api";

export interface GetChainedEventsParams {
	entityId: number | null;
}

export interface GetChainedEventsResponse
	extends NonNullable<operations["GetChainedEvents"]["responses"]["200"]> {}

export function useGetChainedEvents(params: MaybeRef<GetChainedEventsParams>) {
	const api = useApiClient();

	return useQuery({
		queryKey: ["chained_events", params] as const,
		async queryFn({ queryKey, signal }) {
			const [, params] = queryKey;

			if (params.entityId == null) {
				return null;
			}

			const response = await api
				.GET("/chained_events/{entityId}", {
					params: {
						path: {
							entityId: params.entityId,
						},
					},
					signal,
				})
				.catch((error: unknown) => {
					if ((error as HttpError).response.status === 404) return null;
					else throw error;
				});
			return { ...response };
		},
		enabled: computed(() => {
			return unref(params).entityId != null;
		}),
	});
}
