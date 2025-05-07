<script lang="ts" setup>
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

const t = useTranslations();
const route = useRoute();

const props = defineProps<{
	relations: NonNullable<PresentationViewModel["relations"]>;
	handledRelations: Array<RelationType>;
}>();
const redundantSystemClasses: Array<string> = []; // ["source"];

type RelationKey = keyof NonNullable<PresentationViewModel["relations"]>;

const relationsByType = computed(() => {
	// if (props.handledRelations.length === 0) return props.relations;
	const filteredRelations = new Map<string, Array<RelatedEntityModel>>();
	for (const key in props.relations) {
		const rels =
			props.relations[key as RelationKey]?.filter((relation) => {
				if (!relation || redundantSystemClasses.includes(relation.systemClass)) return false;
				return !relation.relationTypes?.every((relType) => {
					return props.handledRelations.some((handledRelation) => {
						const relationType = extractRelationTypeFromRelationString(relType?.property);
						if (!relationType) return false;
						return handledRelation.crmCode === relationType.crmCode;
					});
				});
			}) ?? [];
		if (rels.length > 0) filteredRelations.set(key, rels);
	}
	return filteredRelations;
});

// const relationsByType = computed(() => {
// 	return groupByToMap(
// 		filteredRelations.value ?? [],
// 		(relation: NonNullable<EntityFeature["relations"]>[0]) => {
// 			// FIXME: This used to use `relationType` (without the prefix)

// 			return relation.relationSystemClass;
// 		},
// 	);
// });

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

const currentMode = computed(() => {
	return route.query.mode;
});
</script>

<template>
	<div v-if="relationsByType.size > 0">
		<h1 class="pb-2 font-semibold leading-none tracking-tight">{{ t("EntityPage.details") }}</h1>
		<dl
			class="grid gap-x-8 gap-y-4 sm:grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))] sm:justify-start"
		>
			<div v-for="[relationType, relations] of relationsByType" :key="relationType">
				<dt class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
					{{ t(`SystemClassNames.${relationType}`) }}
				</dt>
				<dd>
					<ul role="list">
						<li v-for="(relation, index) of relations.slice(0, 10)" :key="index">
							<NavLink
								v-if="relation?.id"
								class="underline decoration-dotted hover:no-underline"
								:href="{
									path: `/${getPath()}`,
									query: {
										mode: currentMode,
										selection: relation.id,
									},
								}"
							>
								{{ relation.title }}
							</NavLink>
							<span v-else> {{ relation?.title }} </span>
						</li>
					</ul>
					<details v-if="relations.length > 10">
						<summary class="cursor-pointer py-1 text-sm text-muted-foreground">Show more</summary>
						<ul role="list">
							<li v-for="(relation, index) of relations.slice(10)" :key="index">
								<NavLink
									v-if="relation?.id"
									class="underline decoration-dotted hover:no-underline"
									:href="{
										path: `/${getPath()}`,
										query: {
											mode: currentMode,
											selection: relation.id,
										},
									}"
								>
									{{ relation.title }}
								</NavLink>
								<span v-else> {{ relation?.title }} </span>
							</li>
						</ul>
					</details>
				</dd>
			</div>
		</dl>
	</div>
</template>
