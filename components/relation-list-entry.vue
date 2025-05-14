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
}>();

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

function setShowOnMap() {
	void router.push({
		query: { ...route.query, mode: "map", detail: props.relation.id },
	});
}

const currentMode = computed(() => {
	return route.query.mode;
});

function hasValidTimespans(
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
</script>

<template>
	<div class="my-2 flex grow basis-2 items-center justify-between gap-4">
		<div class="grid flex-[2] grid-cols-[auto_1fr] items-center gap-2">
			<Component
				:is="getEntityIcon(relation.systemClass)"
				v-if="relation.systemClass"
				class="mr-1 inline size-5 pb-1"
			/>
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
					<span class="text-xs text-muted-foreground">{{ relation.standardType.title }}</span>
				</template>
			</span>
		</div>

		<template v-if="hasValidTimespans(relation.when)">
			<SimpleTimespan class="text-xs" :timespans="[relation.when]" />
		</template>
		<template v-if="showIcon">
			<Button :disabled="centroid === undefined" variant="outline" @click="setShowOnMap()">
				<span class="text-xs font-normal">{{ t("EntityPage.showOnMap") }}</span>
			</Button>
		</template>
	</div>
</template>
