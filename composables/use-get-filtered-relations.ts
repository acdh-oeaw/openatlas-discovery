import { project } from "@/config/project.config";
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

function getDetailViewConfig(entity: PresentationViewModel) {
	let customConfig = project.detailView.find((entry) => {
		return entry.affectedSystemClasses?.includes(entity.systemClass);
	});
	if (!customConfig)
		customConfig = project.detailView.find((entry) => {
			return !entry.affectedSystemClasses?.length;
		});
	return customConfig;
}

function getFilteredRelations(entity: PresentationViewModel) {
	const detailViewConfig = getDetailViewConfig(entity);
	const res: Record<string, Array<RelatedEntityModel>> = {};
	for (const relation in entity.relations) {
		if (
			!detailViewConfig?.primarySystemClasses ||
			detailViewConfig.primarySystemClasses.includes(relation)
		)
			res[relation] = entity.relations[relation as keyof PresentationViewModel["relations"]];
	}
	for (const otherKey in entity) {
		if (
			!detailViewConfig?.primarySystemClasses ||
			detailViewConfig.primarySystemClasses.includes(otherKey)
		)
			res[otherKey] = entity[otherKey as keyof PresentationViewModel] as Array<RelatedEntityModel>;
	}
	if (!detailViewConfig?.affectedSystemClasses)
		return Object.entries(res).filter((rel) => {
			return Array.isArray(rel[1]) && rel[1].length;
		});
	const sortedRelations = Object.entries(res)
		.filter((rel) => {
			return Array.isArray(rel[1]) && rel[1].length;
		})
		.toSorted((relA, relB) => {
			let indexA = detailViewConfig.customOrdering?.indexOf(relA[0]) ?? -1;
			if (indexA === -1) indexA = Object.entries(res).length;
			let indexB = detailViewConfig.customOrdering?.indexOf(relB[0]) ?? -1;
			if (indexB === -1) indexB = Object.entries(res).length;
			return indexA - indexB || relA[0].localeCompare(relB[0]);
		});
	return sortedRelations;
}

export function useGetFilteredRelations() {
	return { getFilteredRelations };
}
