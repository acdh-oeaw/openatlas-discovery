<script setup lang="ts">
import type { CustomIconEntry } from "@/types/api";
import * as LucideIcons from "lucide-static";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-vue-next";

const t = useTranslations();

const props = defineProps<{
	iconData: Record<string, CustomIconEntry>;
	moveData: Array<CustomGeoJsonFeature>;
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
	() => {
		return visibleIcons.value;
	},
	() => {
		emit("visible-icons", visibleIcons.value);
	},
);

onMounted(() => {
	visibleIcons.value = Object.keys(props.iconData);
});

const expandedState = ref(true);
</script>

<template>
	<Sheet>
		<SheetTrigger>
			<button
				class="absolute left-full top-1/2 -z-10 block -translate-x-2 rounded-md bg-[hsl(var(--card))] py-2 pl-1 shadow-md"
				style="top: calc(50%)"
				@click="expandedState = !expandedState"
			>
				<ChevronLeftIcon
					class="-ml-8 size-8"
					:class="{ block: expandedState, hidden: !expandedState }"
				/>
				<ChevronRightIcon
					class="-ml-8 size-8"
					:class="{ hidden: expandedState, block: !expandedState }"
				/>
			</button>
		</SheetTrigger>
		<SheetContent :backdrop="false" variant="legend" class="bg-none border-none shadow-none">
			<aside
				class="flex gap-2 overflow-x-auto rounded-md border-2 border-transparent bg-white m-2 text-sm shadow-md p-2"
			>
				<div class="inline-flex">
					<div>
						<div class="text-xs text-muted-foreground">
							{{ $t("DataMapView.icons") }}
						</div>
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
					</div>
				</div>
			</aside>
		</SheetContent>
	</Sheet>
</template>
