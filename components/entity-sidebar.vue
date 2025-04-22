<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from "lucide-vue-next";

const t = useTranslations();
const router = useRouter();
const route = useRoute();

const props = defineProps<{
	id: number;
	noTableSidebar: boolean;
}>();

const { data } = useGetEntity(
	computed(() => {
		return { entityId: props.id };
	}),
);

const entity = computed(() => {
	return data.value?.features[0];
});

const openState = ref(false);

onMounted(() => {
	openState.value = true;
});

watch(
	() => {
		return props.id;
	},
	() => {
		openState.value = true;
	},
	{ immediate: true, deep: true },
);
const handledRelations = ref<Array<RelationType>>([]);

const updateHandledRelations = (relations: Array<RelationType>) => {
	handledRelations.value = [...relations];
};

function clearSelection() {
	void router.push({ query: { ...route.query, selection: null } });
}
defineExpose({ openState });
</script>

<template>
	<div v-if="entity != null && props.id != null">
		<div
			class="group z-20 mb-2 mr-2 flex h-full transition-transform duration-300"
			:class="{
				'absolute w-1/4': props.noTableSidebar,
				'translate-x-0': openState,
				'-translate-x-full': !openState,
			}"
			:open="openState"
		>
			<div
				class="relative size-full max-h-full grow basis-full overflow-y-auto rounded-lg border bg-card px-6 py-4 text-card-foreground shadow"
			>
				<Button
					variant="transparent"
					class="float-right -mr-6 -mt-4 p-2 text-neutral-600 hover:text-black dark:text-neutral-400 dark:hover:text-white"
					@click="clearSelection"
					><XIcon class="size-4"></XIcon
				></Button>
				<EntityPrimaryDetails :entity="entity" @handled-relations="updateHandledRelations" />

				<slot name="custom-details" />
				<!-- <component v-if="hasCustomDetails" v-bind:is="entityDetailsDict" bind:entity-data /> -->

				<EntityDetails
					v-if="entity.relations && entity.relations?.length > 0"
					:handled-relations="handledRelations"
					:relations="entity.relations"
					class="rounded-md border px-4 py-3 text-sm"
				/>
			</div>
			<button
				class="absolute left-full top-1/2 -z-10 block -translate-x-2 rounded-md bg-[hsl(var(--card))] py-2 pl-1 shadow-md"
				style="top: calc(50% - 40px)"
				@click="openState = !openState"
			>
				<ChevronLeftIcon class="ml-auto size-8" :class="{ block: openState, hidden: !openState }" />
				<ChevronRightIcon
					class="ml-auto size-8"
					:class="{ hidden: openState, block: !openState }"
				/>
				<span class="sr-only">{{
					t("EntityPage.sidebar.toggle", { title: entity.properties.title })
				}}</span>
			</button>
		</div>
	</div>
</template>
