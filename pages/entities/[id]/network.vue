<script lang="ts" setup>
definePageMeta({
	layout: "network"
});

const t = useTranslations();

const route = useRoute();

const id = computed(() => {
	return Number(route.params.id as string);
});

const { data, isPending, isPlaceholderData } = useGetEntity(
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

const view = useGetCurrentView();

useHead({
	title: computed(() => {
		return entity.value?.properties.title ?? t("EntityPage.meta.title");
	}),
});
</script>

<template>
	<template v-if="entity != null">
		<EntitySidebar :entity="entity" />
	</template>
</template>
