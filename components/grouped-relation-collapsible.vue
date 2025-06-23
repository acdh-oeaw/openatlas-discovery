<script lang="ts" setup>
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

const t = useTranslations();

/** @param relations should be an  */
const props = defineProps<{
	title: string;
	relations: Array<NonNullable<RelatedEntityModel>>;
	// relationType: RelationType;
	systemClass?: string;
	showOnMap: boolean;
	entity: PresentationViewModel;
}>();

const filteredRelations = computed(() => {
	return props.relations.filter((rel, idx) => {
		const indexIsFine =
			props.relations.findIndex((r) => {
				return r.id === rel.id;
			}) === idx;
		const relationTypesAreFine =
			rel.relationTypes?.some((type) => {
				return type?.relationTo === props.entity.id;
			}) ?? true;
		return indexIsFine && relationTypesAreFine;
	});
});
</script>

<template>
	<div v-if="props.relations.length" class="w-full rounded-md border px-4 py-3 text-sm">
		<div class="flex items-center justify-between space-x-4">
			<Accordion type="single" collapsible class="w-full">
				<AccordionItem value="item-1">
					<AccordionTrigger class="grid grid-cols-[auto_1fr] place-items-end">
						<h4 class="text-sm font-semibold">
							{{ t(`SystemClassNames.${title}`) }}
							{{ filteredRelations.length ? `(${filteredRelations.length})` : "" }}
						</h4>
					</AccordionTrigger>
					<AccordionContent>
						<!-- <template v-for="rels in props.relations" :key="title"> -->
						<RelationCollapsible
							class="mb-8"
							:title="title ?? ''"
							:relations="filteredRelations"
							:show-icon="props.showOnMap"
							:entity="entity"
						/>
						<!-- </template> -->
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	</div>
</template>
