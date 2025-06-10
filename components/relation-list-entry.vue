<script lang="ts" setup>
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";
import { extractRelationTypeFromRelationString } from "@/utils/extract-crm-code";

const t = useTranslations();

const route = useRoute();
const router = useRouter();

const props = defineProps<{
	showIcon: boolean;
	type?: string;
	relation: NonNullable<RelatedEntityModel>;
	entityId: number;
}>();

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

function setShowOnMap() {
	void router.push({
		query: { ...route.query, mode: "map", showOnMap: props.relation.id },
	});
}

const currentMode = computed(() => {
	return route.query.mode;
});

function _hasValidTimespans(
	timespan: NonNullable<PresentationViewModel["when"]> | null | undefined,
): boolean {
	if (!timespan) {
		return false;
	}

	const { start, end } = timespan;
	return (
		start.earliest != null ||
		start.latest != null ||
		start.comment != null ||
		end.earliest != null ||
		end.latest != null ||
		end.comment != null
	);
}

const centroid = computed(() => {
	if (
		props.relation.geometries?.type === "Feature" &&
		props.relation.geometries.geometry?.type === "Point"
	) {
		return props.relation.geometries.geometry;
	}
	if (props.relation.geometries?.type === "FeatureCollection") {
		return props.relation.geometries.features.find((a) => {
			return a.geometry?.type === "Point";
			// return a.geometry?.shapeType === "centerpoint";
		});
	}
	return undefined;
});

const _relationTitle = computed(() => {
	return [
		...new Set(
			props.relation.relationTypes?.map((relationType) => {
				const extracted = extractRelationTypeFromRelationString(relationType?.property);
				return extracted ? useRelationTitle({ ...extracted, inverse: !extracted.inverse }) : "";
			}),
		),
	].join(", ");
});

const related = computed(() => {
	return (
		props.relation.relationTypes
			?.filter((rel) => {
				return rel?.relationTo === props.entityId;
			})
			.filter((rel) => {
				return !rel?.property.startsWith("crm:P73");
			})
			.filter((rel) => {
				return rel != null;
			}) ?? []
	);
});

function getPropertyTranslation(property: string) {
	const code = extractRelationTypeFromRelationString(property);

	if (code?.crmCode === "P9") {
		if (!code.inverse) {
			return t("EntityPage.subEvent");
		}
		return t("EntityPage.superEvent");
	}

	if (code?.crmCode === "P73") {
		if (code.inverse) {
			return null;
		}
		return null;
	}
	return code ? useRelationTitle({ ...code, inverse: !code.inverse }) : "";
}

const sourceAccordionOpen = ref(false);
</script>

<template>
	<div class="my-2 flex grow basis-2 items-center justify-between gap-3">
		<Component
			:is="getEntityIcon(relation.systemClass)"
			v-if="relation.systemClass"
			class="mr-1 inline size-5 pb-1"
			:class="related.length > 1 ? 'mt-2 self-start' : ''"
		/>
		<div class="grid flex-[2] grid-cols-[auto_1fr] items-center gap-2">
			<span class="grid grid-rows-2 data-[oneRow]:grid-rows-1" :data-oneRow="type === null">
				<NavLink
					class="underline decoration-dotted hover:no-underline"
					:href="{
						path: `/${getPath()}`,
						query: { mode: currentMode, selection: relation.id },
					}"
				>
					{{ relation.title }}
				</NavLink>
				<template v-if="relation.standardType != null">
					<span class="text-xs text-muted-foreground"
						>{{ relation.standardType.title }}
						{{ relation.standardType.title && related.length > 0 ? "|" : "" }}
						<span v-for="(rel, idx) in related" :key="`${relation.id}-${idx}`">
							{{ getPropertyTranslation(rel.property) }}
							{{ rel.type ? `| ${rel.type}` : "" }}
							<br v-if="idx < related.length - 1" />
						</span>
					</span>
				</template>
			</span>
		</div>

		<!-- <template v-if="hasValidTimespans(relation.when)">
			<SimpleTimespan class="text-xs" :timespans="[relation.when]" />
		</template> -->
		<Toggle
			v-if="relation.systemClass === 'source_translation'"
			variant="outline"
			@click="sourceAccordionOpen = !sourceAccordionOpen"
		>
			<span class="text-xs font-normal">{{ t("EntityPage.showText") }}</span>
		</Toggle>
		<template v-if="showIcon">
			<Button :disabled="centroid === undefined" variant="outline" @click="setShowOnMap()">
				<span class="text-xs font-normal">{{ t("EntityPage.showOnMap") }}</span>
			</Button>
		</template>
	</div>
	<Accordion
		v-if="relation.systemClass === 'source_translation'"
		type="single"
		collapsible
		class="max-w-full"
	>
		<AccordionItem :open="sourceAccordionOpen" :value="String(relation.id)">
			<AccordionContent>
				<SourceContent :id="relation.id"></SourceContent>
			</AccordionContent>
		</AccordionItem>
	</Accordion>
</template>
