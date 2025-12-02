<script setup lang="ts">
const props = defineProps<{
	id: number;
}>();

const { data } = useGetEntity(
	computed(() => {
		return { entityId: props.id };
	}),
);
</script>

<template>
	<span class="block text-justify hyphens-auto">
		{{ data?.description }}
	</span>
</template>
