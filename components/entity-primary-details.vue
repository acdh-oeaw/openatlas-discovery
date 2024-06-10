<script setup lang="ts">
import CustomPrimaryDetailsActor from '@/components/custom-primary-details-actor.vue';
import CustomPrimaryDetailsPlace from '@/components/custom-primary-details-place.vue';

const props = defineProps<{
	entity: EntityFeature,
}>();

const images = computed(() => {
	return props.entity.depictions
		?.reduce((acc: Array<{url: string, license:string}>, depiction) => {
			if (depiction.url && depiction.license) {
				acc.push({
					url: depiction.url,
					license: depiction.license
				});
			}
			return acc;
		}, []);
});

const customPrimaryDetails = computed(() => {
	return entityPrimaryDetailsDict[props.entity.systemClass];
});

const entityPrimaryDetailsDict: Record<string, Component> = {
	"person": CustomPrimaryDetailsActor,
	"group": CustomPrimaryDetailsActor,
	"stratigraphic_unit": CustomPrimaryDetailsPlace,
}

const handledRelations: Array<RelationType> = [
	{
		crmCode: "P1" // "is identified by" are the aliases
	},
	{
		crmCode: "P2" // "has type" are the types
	}
]

const emit = defineEmits({
	handledRelations(payload: Array<RelationType>) {
		return payload;
	}}
);

let alreadyEmitted = false;

onMounted(() => {
	if (!alreadyEmitted) emitHandledRelations([]);
});

function emitHandledRelations(relations: Array<RelationType>) {
	alreadyEmitted = true;
	emit("handledRelations", [...handledRelations, ...relations]);
}

</script>

<template>
	<CardHeader>
		<EntitySystemClass :system-class="entity.systemClass" />
		<PageTitle>{{ entity.properties.title }}</PageTitle>
		<EntityAliases v-if="entity.names" :aliases="entity.names" />
		<EntityTimespans :timespans="entity.when?.timespans" />
	</CardHeader>
	<CardContent>
		<div class="grid gap-4">
			<EntityDescriptions :descriptions="entity?.descriptions ?? []" />
			<!-- Types -->
			<div class=" flex flex-row flex-wrap gap-1">
				<TypesPopover
					v-for="type in entity.types"
					:key="(type.identifier ?? type.label) ?? 'missing'"
					:type="type" />
			</div>

			<component
				:is="customPrimaryDetails"
				v-if="customPrimaryDetails"
				:entity="entity"
				@handled-relations="emitHandledRelations"
			/>

			<EntityImages v-if="images" :images="images" class="overflow-hidden"/>
		</div>
	</CardContent>
</template>
