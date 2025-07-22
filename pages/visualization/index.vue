<script lang="ts" setup>
definePageMeta({
	layout: "visualization",
	middleware: [
		"database-check",
		() => {
			const { markVisited } = useInitialVisit();
			markVisited();
		},
	],
});

const t = useTranslations();

usePageMetadata({
	title: t("MapPage.meta.title"),
});

const route = useRoute();

const currentMode = computed(() => {
	console.log(route.query.mode);
	return route.query.mode;
});
</script>

<template>
	<MainContent class="grid grid-rows-[auto_1fr]">
		<div>
			<PageTitle class="sr-only">{{ t("MapPage.title") }}</PageTitle>
		</div>
		<ErrorBoundary>
			<DataMapView v-if="currentMode === 'map'" />
			<DataNetworkView v-if="currentMode === 'network'" />
			<DataView v-if="currentMode === 'table'"></DataView>
			<DataImageView v-if="currentMode === 'images'"></DataImageView>
		</ErrorBoundary>
	</MainContent>
</template>
