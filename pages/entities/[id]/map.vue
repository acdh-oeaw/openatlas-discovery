<script lang="ts" setup>
definePageMeta({
	layout: "entity"
});

const t = useTranslations();

const env = useRuntimeConfig();
</script>

<template>
	<template v-if="env.public.NUXT_PUBLIC_DATABASE !== 'disabled'">
		<ErrorBoundary>
			<DataMapView />
		</ErrorBoundary>
	</template>
	<template v-else>
		<div>{{ t("DataPage.work-in-progress") }}</div>
	</template>
</template>
