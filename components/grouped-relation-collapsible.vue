<script lang="ts" setup>
import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@/components/ui/accordion";
import type { RelatedEntityModel } from "@/types/api";

const t = useTranslations();

/** @param relations should be an  */
const props = defineProps<{
	title: string;
	relations: Array<NonNullable<RelatedEntityModel>>;
	// relationType: RelationType;
	systemClass?: string;
	showOnMap: boolean;
}>();

const filteredRelationCount = computed(() => {
	return props.relations.length;
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
							{{ filteredRelationCount ? `(${filteredRelationCount})` : "" }}
						</h4>
					</AccordionTrigger>
					<AccordionContent>
						<!-- <template v-for="rels in props.relations" :key="title"> -->
						<RelationCollapsible
							class="mb-8"
							:title="title ?? ''"
							:relations="props.relations"
							:show-icon="props.showOnMap"
						/>
						<!-- </template> -->
					</AccordionContent>
				</AccordionItem>
			</Accordion>
		</div>
	</div>
</template>
