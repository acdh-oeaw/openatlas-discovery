<script setup lang="ts">

const {getUnprefixedId} = useIdPrefix();

const t = useTranslations();

const props = defineProps<{entity: EntityFeature}>();

const getRelationTitle = (relation: RelationType) => {
	return useRelationTitle(relation)
}

const getRelationGroupTitle = (relation: RelationType) => {
	return useRelationGroupTitle(relation)
}

const collapsibleRelations: Array<{
	relationType: RelationType,
	title: string
}> = [
	{
		relationType: {
			crmCode:"P46"
		},
		title: t(getRelationGroupTitle({crmCode: "P46"}))
	},
]

</script>

<template>

<GroupedRelationCollapsible
		v-for="rel in collapsibleRelations"
		:key="rel.relationType.crmCode + rel.relationType.inverse"
		:title="rel.title"
		:relations="entity.relations"
		:relation-type="rel.relationType"
	/>
</template>
