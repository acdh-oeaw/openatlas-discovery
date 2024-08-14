<script setup lang="ts">
import { SearchIcon } from "lucide-vue-next";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import type { SearchFormData } from "./search-form.vue";

const searchOpen = ref(false);

function toggleOpenState() {
	if (!searchOpen.value) {
		searchOpen.value = true;
	} else searchOpen.value = false;
}

const props = defineProps<SearchFormData>();

const emit = defineEmits<{
	(event: "submit", values: SearchFormData): void;
}>();

const t = useTranslations();

function onSubmit(event: Event) {
	const element = event.currentTarget as HTMLFormElement;
	const formData = new FormData(element);

	emit("submit", {
		search: formData.get("q") as string,
		category: formData.get("category") as Category,
	});
}
const searchLabelId = "search-field";
</script>

<template>
	<div v-if="searchOpen != null">
		<Collapsible v-model:open="searchOpen">
			<CollapsibleTrigger class="m-auto grid p-2">
				<Button class="size-12 rounded-full">
					<SearchIcon aria-hidden="true" class="size-4 shrink-0" />
				</Button>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<form
					class="mt-2 grid w-full max-w-[800px] grid-rows-[1fr_1fr_auto] items-end gap-y-2 rounded-md bg-white/90 p-2 py-4 shadow-md dark:bg-neutral-900"
					role="search"
					@submit.prevent="onSubmit"
				>
					<div class="grid gap-y-1">
						<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
						<Select name="category" :default-value="props.category">
							<SelectTrigger :aria-label="t('SearchForm.filter')">
								<SelectValue :placeholder="t('SearchForm.select-filter')" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem v-for="category of categories" :key="category" :value="category">
									{{ t(`SearchForm.filters.${category}`) }}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div class="grid gap-y-1">
						<Label :class="{ 'sr-only': project.fullscreen }" :for="searchLabelId">
							{{ t("SearchForm.search") }}
						</Label>
						<Input
							:id="searchLabelId"
							:default-value="props.search"
							name="q"
							:placeholder="t('SearchForm.search')"
							type="search"
						/>
					</div>

					<Button type="submit">
						<SearchIcon aria-hidden="true" class="size-4 shrink-0" />
						{{ t("SearchForm.search") }}
					</Button>
				</form>
			</CollapsibleContent>
		</Collapsible>
	</div>
</template>
