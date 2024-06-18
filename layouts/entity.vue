<script lang="ts" setup>
import { z } from "zod";

const t = useTranslations();

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


useHead({
	title: computed(() => {
		return entity.value?.properties.title ?? t("EntityPage.meta.title");
	}),
});

</script>
<template>
	<NuxtLayout name="default">
		<MainContent class="container relative grid h-full py-8">
			<template v-if="entity != null">
				<EntitySidebar :entity="entity" />
			</template>
			<slot />
		</MainContent>
	</NuxtLayout>
</template>
