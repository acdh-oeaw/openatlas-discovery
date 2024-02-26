<script lang="ts" setup>
import { groupByToMap } from "@acdh-oeaw/lib";
import { z } from "zod";


const NetworkNodes = z.object({
	id: z.string(),
	attributes: z.array(z.object({
		label: z.string(),
		color: z.string(),
	})),
});

type NetworkNode = z.infer<typeof NetworkNodes>;

const NetworkEdges = z.object({
	source: z.string(),
	target: z.string(),
})

let nodes: NetworkNode;

/** const NetworkDataSchema = z.object({
	nodes: z.string().array(),
	edges: z.string().array(),
});


type NetworkData = z.infer<typeof NetworkDataSchema>; */

definePageMeta({
	title: "EntityPage.meta.title",
	validate(route) {
		const env = useRuntimeConfig();
		if (env.public.NUXT_PUBLIC_DATABASE === "disabled") return false;

		const paramsSchema = z.object({
			id: z.coerce.number().int().positive(),
		});
		return paramsSchema.safeParse(route.params).success;
	},
});

const locale = useLocale();
const t = useTranslations();

const route = useRoute();
const id = computed(() => {
	return Number(route.params.id as string);
});

const { data, error, isPending, isPlaceholderData, suspense } = useGetEntity(
	computed(() => {
		return { entityId: id.value };
	}),
);

const isLoading = computed(() => {
	return isPending.value || isPlaceholderData.value;
});

const entity = computed(() => {
	return data.value?.features[0];
});

const entities = computed(() => {
	return data.value?.features ?? [];
});

function getNodes() {
	data.value?.features[0]?.relations?.forEach((element) => {
		const id = element.relationTo?.split("/").at(-1);
		if (id != null) {
			nodes.push();
		}
	});
	getEdges();
}
function getEdges() {}
useHead({
	title: computed(() => {
		return entity.value?.properties.title ?? t("EntityPage.meta.title");
	}),
	// TODO: description, other metadata
});

const tabs = computed(() => {
	const tabs = [];
	if (entity.value?.geometry != null) {
		tabs.push({
			id: "geo-map",
			label: t("EntityPage.map"),
		});
	}
	if (entity.value?.depictions != null) {
		tabs.push({
			id: "images",
			label: t("EntityPage.images", { count: entity.value.depictions.length }),
		});
	}
	if (entity.value?.relations != null) {
		tabs.push({
			id: "network",
			label: t("EntityPage.network"),
		});
	}
	return tabs;
});

const relationsByType = computed(() => {
	return groupByToMap(entity.value?.relations ?? [], (relation) => {
		return relation.relationType;
	});
});
</script>

<template>
	<MainContent class="container relative grid grid-rows-[auto_1fr] gap-4 py-8">
		<template v-if="entity != null">
			<Card>
				<CardHeader>
					<EntitySystemClass :system-class="entity.systemClass" />
					<PageTitle>{{ entity.properties.title }}</PageTitle>
				</CardHeader>
				<CardContent>
					<div class="grid gap-4">
						<EntityTimespans :timespans="entity.when?.timespans" />
						<EntityDescriptions :descriptions="entity?.descriptions ?? []" />
					</div>
				</CardContent>
			</Card>

			<Tabs v-if="tabs.length > 0" :default-value="tabs[0]?.id" @click="getNodes">
				<TabsList>
					<TabsTrigger v-for="tab of tabs" :key="tab.id" :value="tab.id">
						{{ tab.label }}
					</TabsTrigger>
				</TabsList>
				<!-- TODO: keep map alive -->
				<TabsContent v-for="tab of tabs" :key="tab.id" :value="tab.id">
					<EntityGeoMap v-if="tab.id === 'geo-map'" :entities="entities" />
					<EntityImages v-else-if="tab.id === 'images'" :images="entity.depictions" />
					<EntityNetwork v-if="tab.id === 'network'" :network-data="networkData" />
				</TabsContent>
			</Tabs>
			{{ nodes }}
		</template>

		<template v-else-if="isLoading">
			<Centered class="pointer-events-none opacity-50">
				<LoadingIndicator />
			</Centered>
		</template>
	</MainContent>
</template>
