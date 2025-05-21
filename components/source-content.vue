<script setup lang="ts">
const props = defineProps<{
	id: number;
}>();

const { data } = useGetEntity(
	computed(() => {
		console.log("hello from button");
		return { entityId: props.id };
	}),
);
</script>

<template>
	<span class="block hyphens-auto text-justify">
		{{ data?.description }}
	</span>
</template>
