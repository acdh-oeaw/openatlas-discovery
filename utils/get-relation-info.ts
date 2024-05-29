import type { RelationType } from "@/utils/extract-crm-code";

/**
 * @returns The i18n key for the title of a relation
 */
export const getRelationTitle = (relation: RelationType) => {
	return `${relation.crmCode}.title${relation.inverse ? "Inverse" : ""}`;
};

/**
 * @returns The i18n key for the groupTitle of a relation
 */
export const getRelationGroupTitle = (relation: RelationType) => {
	return `${relation.crmCode}.groupTitle${relation.inverse ? "Inverse" : ""}`;
};
