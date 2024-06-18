<script lang="ts" setup>
definePageMeta({
	layout: "entity"
});

const t = useTranslations();

const env = useRuntimeConfig();
</script>

<template>
	<MainContent class="container grid grid-rows-[auto_1fr] py-8">
		<template v-if="env.public.NUXT_PUBLIC_DATABASE !== 'disabled'">
			<ErrorBoundary>
				<DataMapView />
			</ErrorBoundary>
		</template>
		<template v-else>
			<div>{{ t("DataPage.work-in-progress") }}</div>
		</template>
	</MainContent>
</template>
