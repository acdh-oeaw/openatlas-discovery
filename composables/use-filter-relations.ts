import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

type Relations = Array<RelatedEntityModel>;
type RelationTypesModel = NonNullable<RelatedEntityModel>["relationTypes"];

export const useFilterRelations = (
	relations: MaybeRef<PresentationViewModel["relations"]> | null | undefined,
	filters: MaybeRef<{
		relationType?: RelationType;
		systemClass?: EntityFeature["systemClass"];
	}>,
) => {
	if (!relations) return new Map<string, Relations>();

	const { relationType, systemClass } = toValue(filters);
	const relationDict = toValue(relations);

	const filteredRelations = new Map<string, Relations>(
		Object.entries(relationDict ?? {})
			.map(([key, rels]) => {
				const test = rels.reduce((acc: Relations, relation): Relations => {
					if (
						!relation?.relationTypes ||
						(relation.relationTypes as unknown as RelationTypesModel).length === 0
					)
						return acc;

					const mappedRelation = (relation.relationTypes as unknown as RelationTypesModel)
						.filter((type) => {
							if (!type) return false;
							const { crmCode, inverse } =
								extractRelationTypeFromRelationString(type.property) ?? {};
							if (
								relationType &&
								!systemClass &&
								crmCode === relationType.crmCode &&
								inverse === !relationType.inverse
							)
								return true;
							if (systemClass && !relationType && systemClass === relation.systemClass) return true;
							if (
								relationType &&
								systemClass &&
								crmCode === relationType.crmCode &&
								inverse === !relationType.inverse &&
								systemClass === relation.systemClass
							)
								return true;
							return false;
						})
						.map((relationType) => {
							return {
								...relation,
								relationTypes: [relationType],
							};
						});
					console.log("Mapped: ", mappedRelation, relation);
					return [...acc, ...mappedRelation];
				}, []);
				return [key, test] as [string, Relations];
			})
			.filter(([key, rels]) => {
				if (rels.length <= 0) console.log("Filtering: ", key, rels);
				return rels.length > 0;
			}),
	);
	return filteredRelations;
};
