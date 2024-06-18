<script lang="ts" setup>
import { z } from "zod";

definePageMeta({
	validate(route) {
		const env = useRuntimeConfig();
		if (env.public.NUXT_PUBLIC_DATABASE === "disabled") return false;

		const paramsSchema = z.object({
			id: z.coerce.number().int().positive(),
		});
		return paramsSchema.safeParse(route.params).success;
	},
});

const t = useTranslations();

usePageMetadata({
	title: t("EntityPage.meta.title"),
});

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

const entities = computed(() => {
	return data.value?.features ?? [];
});

useHead({
	title: computed(() => {
		return entity.value?.properties.title ?? t("EntityPage.meta.title");
	}),
	// TODO: description, other metadata
});


</script>

<template>
	<MainContent class="relative h-full">
		<template v-if="entity != null">
			<EntitySidebar :entity="entity" />

			<EntityGeoMap :entities="entities" />
		</template>

		<template v-else-if="isLoading">
			<Centered class="pointer-events-none opacity-50">
				<LoadingIndicator />
			</Centered>
		</template>
	</MainContent>
</template>
