<script setup lang="ts">
import { MapPinIcon } from 'lucide-vue-next';

const {getUnprefixedId} = useIdPrefix();

const t = useTranslations();

const props = defineProps<{entity: EntityFeature}>();

interface Place {
	label: string,
	id: string,
	relationType: RelationType | null
}

// TODO: Make use of first and last event if no places are available
const places = computed(() => {
	return props.entity.relations?.reduce((acc: Array<Place>, relation) => {
		if(relation.relationSystemClass !== "object_location") return acc;
		if(!relation.label || !relation.relationTo || !relation.relationType) return acc;
		const id = getUnprefixedId(relation.relationTo);
		const relationType = extractRelationTypeFromRelationString(relation.relationType);
		const label = relation.label;
		if(!id) return acc;
		return [
			...acc,
			{
				label,
				id,
				relationType
			}]
	}, []);
});

const getRelationTitle = (relation: RelationType) => {
	if(props.entity.systemClass === 'person') {
		return useRelationTitle(relation, 'person')
	}
	return useRelationTitle(relation)
}

const getRelationGroupTitle = (relation: RelationType) => {
	if(props.entity.systemClass === 'person') {
		return useRelationGroupTitle(relation, 'person')
	}
	return useRelationGroupTitle(relation)
}


const collapsibleRelations: Array<{
	relationType: RelationType,
	title: string
}> = [
	{
		relationType: {
			crmCode:"OA7"
		},
		title: t(getRelationGroupTitle({crmCode: "OA7"}))
	},
	{
		relationType: {
			crmCode: "P107",
			inverse: true
		},
		title: t(getRelationGroupTitle({crmCode:"P107", inverse: true}))
	},
	{
		relationType: {
			crmCode: "P107"
		},
		title: t(getRelationGroupTitle({crmCode:"P107"}))
	}
]

const handledRelations: Array<RelationType> = [
	{
		crmCode: "P107"
	},
	{
		crmCode: "P74"
	},
	{
		crmCode: "OA7"
	},
	{
		crmCode: "OA8"
	},
	{
		crmCode: "OA9"
	}
]

const emit = defineEmits({
	handledRelations(payload: Array<RelationType>) {
		return payload;
	}}
);

onMounted(() => {
	emit("handledRelations", handledRelations);
})


</script>

<template>
	<div class="flex w-full flex-row flex-wrap gap-4">
		<template
			v-for="(place) in places"
			:key="place.label || `place-${index}`"
		>
			<InfoCard
				v-if="place.relationType"
				class="max-w-48 p-4"
				:icon="MapPinIcon"
				:title="getRelationTitle(place.relationType)"
				>
				<template #content>
					<EntityPreviewLink v-if="place.id" :id="useToNumber(place.id).value">
						{{ place.label }}
					</EntityPreviewLink>
					{{ place.id ? '' : place.label }}
				</template>
			</InfoCard>
		</template>
	</div>
	<GroupedRelationCollapsible
		v-for="rel in collapsibleRelations"
		:key="rel.relationType.crmCode + rel.relationType.inverse"
		:title="rel.title"
		:relations="entity.relations"
		:relation-type="rel.relationType"
	/>
</template>
