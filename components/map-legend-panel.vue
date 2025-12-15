<script setup lang="ts">
import * as LucideIcons from "lucide-static";
import { ChevronLeftIcon, ChevronRightIcon, SplineIcon } from "lucide-vue-next";

import type { CustomMapLegendEntry } from "@/types/api";

// const t = useTranslations();

const props = defineProps<{
	iconData: Record<string, CustomMapLegendEntry>;
	moveData: Record<string, CustomMapLegendEntry>;
}>();

const emit = defineEmits<{
	(e: "visible-icons", visibleIcons: Array<string>): void;
}>();

const visibleIcons = ref<Array<string>>(Object.keys(props.iconData));

function toggleIcon(key: string) {
	if (visibleIcons.value.includes(key))
		visibleIcons.value = visibleIcons.value.filter((i) => {
			return i !== key;
		});
	else {
		visibleIcons.value.push(key);
	}
}

watch(
	visibleIcons,
	() => {
		emit("visible-icons", visibleIcons.value);
	},
	{ deep: true },
);

onMounted(() => {
	visibleIcons.value = Object.keys(props.iconData);
	setTimeout(() => {
		return (expandedState.value = true);
	}, 500);
});

const expandedState = ref(false);
function toggleExpandedState() {
	expandedState.value = !expandedState.value;
}
</script>

<template>
	<div
		class="max-w-1/4 fixed inset-y-0 right-0 top-20 z-50 max-h-fit bg-none transition-transform duration-500 ease-in-out"
		:class="expandedState ? 'translate-x-0' : 'translate-x-full'"
	>
		<button
			class="absolute right-full top-2 -z-10 -ml-8 block w-8 rounded-l-md bg-[hsl(var(--card))] px-1 py-2 shadow-md"
			:class="expandedState ? 'translate-x-2' : 'translate-x-0'"
			@click="toggleExpandedState"
		>
			<ChevronRightIcon class="size-8" :class="{ block: expandedState, hidden: !expandedState }" />
			<ChevronLeftIcon class="size-8" :class="{ hidden: expandedState, block: !expandedState }" />
		</button>
		<div>
			<aside
				class="m-2 flex gap-2 overflow-x-auto rounded-r-md border-2 border-transparent bg-white p-2 text-sm shadow-md"
			>
				<div class="inline-flex">
					<Tabs default-value="icons">
						<TabsList>
							<TabsTrigger value="icons" class="text-xs">
								{{ $t("DataMapView.icons") }}
							</TabsTrigger>
							<TabsTrigger value="movements" class="text-xs">
								{{ $t("DataMapView.featuredMovements") }}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="icons">
							<Toggle
								v-for="[key, entry] in Object.entries(props.iconData).sort(
									(a, b) => a[1].type?.label?.localeCompare(b[1].type?.label ?? '') ?? 0,
								)"
								:key="entry.type?.identifier"
								:pressed="visibleIcons.includes(key)"
								class="group my-2 flex min-w-0 items-center text-left"
								variant="iiif"
								@click="() => toggleIcon(key)"
							>
								<div
									v-if="entry.icon != null"
									class="mr-2 size-6 scale-[0.7]"
									v-html="LucideIcons[entry.icon.replaceAll('-', '') as keyof typeof LucideIcons]"
								></div>
								<span
									>{{ entry.type?.label
									}}<Badge variant="groupOutline" class="ml-4">{{
										entry.entities.length
									}}</Badge></span
								>
							</Toggle>
						</TabsContent>
						<TabsContent value="movements">
							<Toggle
								v-for="[key, entry] in Object.entries(props.moveData).sort(
									(a, b) => a[1].type?.label?.localeCompare(b[1].type?.label ?? '') ?? 0,
								)"
								:key="entry.type?.identifier"
								:pressed="visibleIcons.includes(key)"
								class="group my-2 flex min-w-0 items-center text-left"
								variant="iiif"
								@click="() => toggleIcon(key)"
							>
								<SplineIcon :style="{ color: entry.color }" class="size-6 scale-[0.7]"></SplineIcon>
								<span
									>{{ entry.type?.label
									}}<Badge variant="groupOutline" class="ml-4">{{
										entry.entities.length
									}}</Badge></span
								>
							</Toggle>
						</TabsContent>
					</Tabs>
				</div>
			</aside>
		</div>
	</div>
</template>
