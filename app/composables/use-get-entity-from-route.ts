export const useGetEntityFromRoute = () => {
	const route = useRoute();

	const id = computed(() => {
		return Number(route.params.id as string);
	});

	const {
		data: queryData,
		isPending,
		isPlaceholderData,
	} = useGetEntity(
		computed(() => {
			return { entityId: id.value };
		}),
	);

	const entity = computed(() => {
		return queryData.value;
	});

	const isLoading = computed(() => {
		return isPending.value || isPlaceholderData.value;
	});

	return { entity, isLoading };
};
