export const useUseFilterRelations = (
	relations: MaybeRef<Array<NonNullable<EntityFeature["relations"]>[0]>>,
	filters: MaybeRef<{
		relationType: RelationType;
		viewClass: EntityFeature["viewClass"];
		systemClass: EntityFeature["systemClass"];
	}>,
) => {
	return ref();
};
