<script lang="ts" setup>
import { DotIcon } from "lucide-vue-next";
import {
	DropdownMenuItemIndicator,
	DropdownMenuRadioItem,
	type DropdownMenuRadioItemEmits,
	type DropdownMenuRadioItemProps,
	useEmitAsProps,
} from "radix-vue";

import { cn } from "@/utils/styles";

const props = defineProps<DropdownMenuRadioItemProps & { class?: string }>();

const emits = defineEmits<DropdownMenuRadioItemEmits>();
</script>

<template>
	<DropdownMenuRadioItem
		v-bind="{ ...props, ...useEmitAsProps(emits) }"
		:class="
			cn(
				'data-[highlighted]:bg-outline-hover relative flex cursor-default items-center rounded-md py-1.5 pl-7 text-sm transition-colors outline-none select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
				props.class,
			)
		"
	>
		<span class="absolute left-2 flex size-3.5 items-center justify-center">
			<DropdownMenuItemIndicator>
				<DotIcon class="size-4 fill-current" />
			</DropdownMenuItemIndicator>
		</span>
		<slot />
	</DropdownMenuRadioItem>
</template>
