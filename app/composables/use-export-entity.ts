import type { operations } from "@/lib/api-client/api";

export interface ExportEntityParams
	extends
		NonNullable<operations["GetEntity"]["parameters"]["query"]>,
		NonNullable<operations["GetEntity"]["parameters"]["path"]> {}

export async function useExportEntity(params: ExportEntityParams) {
	const api = useApiClient();
	const entity = await api.GET("/entity/{entityId}", {
		params: {
			path: {
				entityId: params.entityId,
			},
			query: {
				...params,
			},
		},
	});
	return entity;
}
