const hasVisited = ref(0);

export function useInitialVisit() {
	return {
		hasVisited,
		markVisited: () => {
			hasVisited.value++;
			console.log(hasVisited);
		},
	};
}
