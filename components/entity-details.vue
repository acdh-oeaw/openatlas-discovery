<script lang="ts" setup>
import { project } from "@/config/project.config";
import type { PresentationViewModel } from "@/types/api";

const t = useTranslations();
const route = useRoute();

const props = defineProps<{
	entity: PresentationViewModel;
	relations: NonNullable<PresentationViewModel["relations"]>;
	handledRelations: Array<RelationType>;
}>();

const systemClasses = project.detailView.furtherSystemClasses;

const relationsByType = computed(() => {
	return Object.entries(props.relations).filter(([key, _]) => {
		return systemClasses.includes(key);
	}) as Array<[string, Array<AdditionalInfoType>]>;
});

interface AdditionalInfoType {
	title: string;
	id: number;
}

const additionalInfo = computed(() => {
	return Object.entries(props.entity).filter(([key, val]) => {
		return (
			Array.isArray(val) &&
			val.length > 0 &&
			(systemClasses.includes(key) || systemClasses.includes(`${key}s`))
		);
	}) as Array<[string, Array<AdditionalInfoType>]>;
});

const combinedSystemClasses: ComputedRef<Array<[string, Array<AdditionalInfoType>]>> = computed(
	() => {
		const res = [...additionalInfo.value, ...relationsByType.value];
		return res;
	},
);

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
	<div v-if="Object.keys(combinedSystemClasses).length > 0">
		<h1 class="pb-2 font-semibold leading-none tracking-tight">{{ t("EntityPage.details") }}</h1>
		<dl
			class="grid gap-x-8 gap-y-4 sm:grid-cols-[repeat(auto-fill,minmax(min(20rem,100%),1fr))] sm:justify-start"
		>
			<div v-for="[relationType, relations] of combinedSystemClasses" :key="relationType">
				<dt class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
					{{ t(`SystemClassNames.${relationType}`) }}
				</dt>
				<dd>
					<ul role="list">
						<li v-for="(relation, index) of relations" :key="index">
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
				</dd>
			</div>
		</dl>
	</div>
</template>
