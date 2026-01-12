<script lang="ts" setup>
import { Label, type LabelProps } from "radix-vue";

import { useFormField } from "@/components/ui/form/useFormField";
import { cn } from "@/utils/styles";

const _props = defineProps<LabelProps>();

const { error, formItemId } = useFormField();
</script>

<template>
	<Label
		:class="
			cn(
				'block text-left text-sm font-medium tracking-tight text-foreground',
				error && 'text-destructive',
				$attrs.class ?? '',
			)
		"
		:for="formItemId"
	>
		<slot />
	</Label>
</template>
