<script lang="ts" setup>
const { getUnprefixedId } = useIdPrefix();
const route = useRoute();

defineProps<{ type?: string; relation: NonNullable<EntityFeature["relations"]>[0] }>();

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

const t = useTranslations();

const currentMode = computed(() => {
	return route.query.mode;
});
</script>

<template>
	<div class="grid grid-cols-[auto_1fr] items-center justify-between gap-2">
		<div>
			<Component
				:is="getEntityIcon(relation.relationSystemClass)"
				v-if="relation.relationSystemClass"
				class="mr-1 inline size-5 pb-1"
			/>
			<NavLink
				class="underline decoration-dotted hover:no-underline"
				:href="{
					path: `/${getPath()}`,
					query: { mode: currentMode, selection: getUnprefixedId(relation.relationTo ?? '') },
				}"
			>
				{{ relation.label }}
			</NavLink>
		</div>
		<span class="text-xs text-muted-foreground">{{ type ? type : t("EntityPage.noType") }}</span>
		<SimpleTimespan class="ml-4" :timespans="relation.when?.timespans" />
	</div>
</template>
