<script setup lang="ts">
import { MapPinIcon } from 'lucide-vue-next';


const {getUnprefixedId} = useIdPrefix();

const t = useTranslations();

const props = defineProps<{entity: EntityFeature}>();

interface Place {
	label: string,
	id: string,
	relationType: string
}

// TODO: Make use of first and last event if no places are available
const places = computed(() => {
	return props.entity.relations?.reduce((acc: Array<Place>, relation) => {
		if(relation.relationSystemClass !== "object_location") return acc;
		if(!relation.label || !relation.relationTo || !relation.relationType) return acc;
		const id = getUnprefixedId(relation.relationTo);
		if(!id) return acc;
		return [
			...acc,
			{
				label: relation.label,
				id,
				relationType: relation.relationType
			}]
	}, []);
});

// TODO: Move this to a shared location and add localization
const relationTypeLibrary: Ref<Record<string, string>> = computed(() => {
	if(props.entity.systemClass === 'person') return {
		'crm:P74_has_current_or_former_residence': 'Residence',
		'crm:OA9_ends_in': 'Died in',
		'crm:OA8_begins_in': 'Born in',
	}


	return {
		'crm:P74_has_current_or_former_residence': 'Residence',
		'crm:OA9_ends_in': 'Ended in',
		'crm:OA8_begins_in': 'Began in',
	}

});

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

const handledRelations = computed(() => {
	return [
		...collapsibleRelations.map(rel => {return rel.relationType},
		...Object.keys(relationTypeLibrary.value)
	)];
})

</script>

<template>
	<div class="flex w-full flex-row flex-wrap gap-4">
		<EntityPreviewLink
			v-for="(place, index) in places"
			:id="useToNumber(place.id).value"
			:key="place.label || `place-${index}`"
		>
			<Card class="max-w-48 p-4">
				<p class="pb-2 font-bold" >{{ relationTypeLibrary[place.relationType] ?? '' }}</p>
				<p class="text-wrap text-muted-foreground">
					<MapPinIcon class="mr-1 inline-block size-4" />{{ place.label }}
				</p>
			</Card>
		</EntityPreviewLink>
	</div>
	<GroupedRelationCollapsible
		v-for="rel in collapsibleRelations"
		:key="rel.relationType.crmCode + rel.relationType.inverse"
		:title="rel.title"
		:relations="entity.relations"
		:relation-type="rel.relationType"
	/>
</template>
