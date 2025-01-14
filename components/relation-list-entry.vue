<script lang="ts" setup>
import { MapPinXIcon } from "lucide-vue-next";

const { getUnprefixedId } = useIdPrefix();
const route = useRoute();

defineProps<{
	showIcon: boolean;
	type?: string;
	relation: NonNullable<EntityFeature["relations"]>[0];
}>();

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

const currentMode = computed(() => {
	return route.query.mode;
});

function hasValidTimespans(timespans: Array<any> | null | undefined): boolean {
	if (!timespans || timespans.length === 0) {
		return false;
	}

	return timespans.some((timespan) => {
		const { start, end } = timespan;
		return (
			start?.earliest != null ||
			start?.latest != null ||
			start?.comment != null ||
			end?.earliest != null ||
			end?.latest != null ||
			end?.comment != null
		);
	});
}
</script>

<template>
	<div class="my-2 flex grow basis-2 items-center justify-between gap-4">
		<div class="grid grid-cols-[auto_1fr] items-center gap-2">
			<Component
				:is="getEntityIcon(relation.relationSystemClass)"
				v-if="relation.relationSystemClass"
				class="mr-1 inline size-5 pb-1"
			/>
			<span class="grid grid-rows-2 data-[oneRow]:grid-rows-1" :data-oneRow="type === null">
				<NavLink
					class="underline decoration-dotted hover:no-underline"
					:href="{
						path: `/${getPath()}`,
						query: { mode: currentMode, selection: getUnprefixedId(relation.relationTo ?? '') },
					}"
				>
					{{ relation.label }}
				</NavLink>
				<template v-if="type != null">
					<span class="text-xs text-muted-foreground">{{ type }}</span>
				</template>
			</span>
		</div>

		<template v-if="hasValidTimespans(relation.when?.timespans)">
			<SimpleTimespan class="text-xs" :timespans="relation.when?.timespans" />
		</template>
		<template v-if="showIcon">
			<Button variant="outline">
				<span class="text-xs font-normal">Show on Map</span>
				<!--<SvgoShowOnMap :fill="brand"/>  -->
			</Button>
		</template>
	</div>
</template>
