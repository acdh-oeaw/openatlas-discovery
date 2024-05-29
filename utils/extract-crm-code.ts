export function extractCrmCodeFromRelation(
	relation?: string,
): { crmCode: string; inverse: boolean } | null {
	if (!relation) return null;
	let crmCode = relation.replace("crm:", "");
	crmCode = crmCode.split("_")[0] ?? crmCode;

	const inverse = crmCode.endsWith("i");
	return { crmCode: inverse ? crmCode.slice(0, -1) : crmCode, inverse };
}
