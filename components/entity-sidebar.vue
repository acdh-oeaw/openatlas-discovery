<script setup lang="ts">
import { ChevronLeftIcon, ChevronRightIcon, CopyIcon, DownloadIcon, XIcon } from "lucide-vue-next";

import { toast } from "@/components/ui/toast";
import type { ExportEntityParams } from "@/composables/use-export-entity";

const t = useTranslations();
const router = useRouter();
const route = useRoute();

const props = defineProps<{
	id: number;
	mode: string;
	noTableSidebar: boolean;
}>();

const { data } = useGetEntity(
	computed(() => {
		return { entityId: props.id };
	}),
);

const entity = computed(() => {
	return data.value;
});

const openState = ref(false);
const expandedState = ref(false);

onMounted(() => {
	openState.value = true;
});

watch(
	() => {
		return props.id;
	},
	() => {
		openState.value = true;
	},
	{ immediate: true, deep: true },
);

const handledRelations = ref<Array<RelationType>>([]);

const updateHandledRelations = (relations: Array<RelationType>) => {
	handledRelations.value = [...relations];
};

function clearSelection() {
	const query = { ...route.query };
	delete query.selection;

	void router.push({
		path: route.path,
		query,
	});
}

defineExpose({ openState });

const nonEmptyRelations = computed(() => {
	if (!entity.value?.relations) return null;
	const filteredEntries = Object.entries(entity.value.relations).filter(([_, value]) => {
		return value.length > 0;
	});
	return filteredEntries.length > 0 ? Object.fromEntries(filteredEntries) : null;
});

function copyEntity() {
	const fullUrl = window.location.href;
	const baseUrl = fullUrl.split(route.path)[0];
	if (baseUrl) {
		return navigator.clipboard.writeText(`${baseUrl}/entity/${route.query.selection as string}`);
	}
	return null;
}
const exportFormats = computed<Array<[ExportEntityParams["format"], string, string]>>(() => {
	return [
		["lpx", t("EntitySidebar.json"), ".json"],
		["xml", t("EntitySidebar.rdf"), ".xml"],
		["turtle", t("EntitySidebar.ttl"), ".ttl"],
	];
});
async function exportEntity(format: ExportEntityParams["format"], extension: string) {
	const result_raw = await useExportEntity({ format, entityId: props.id });
	const result = format === "lpx" ? JSON.stringify(result_raw) : String(result_raw);
	const blob = new Blob([result], { type: "text/plain" });
	const fileURL = URL.createObjectURL(blob);
	const downloadLink = document.createElement("a");
	const filename = `${data.value?.title ?? String(props.id)}${extension}`;
	downloadLink.href = fileURL;
	downloadLink.download = filename;
	document.body.appendChild(downloadLink);
	downloadLink.click();
	document.body.removeChild(downloadLink);
	URL.revokeObjectURL(fileURL);
	toast.success(t("EntitySidebar.downloaded"), {
		description: t("EntitySidebar.downloadedMessage", { filename: filename }),
	});
}
</script>

<template>
	<div v-if="entity != null && props.id != null">
		<div
			class="group z-20 mb-2 mr-2 flex h-full bg-white transition-all duration-300 ease-in-out"
			:style="
				noTableSidebar
					? {
							width: expandedState ? 'calc(100% - 2rem)' : '25%',
							position: 'absolute',
						}
					: {}
			"
		>
			<div
				class="relative size-full max-h-full grow basis-full overflow-y-auto rounded-lg border bg-card px-6 py-4 text-card-foreground shadow"
			>
				<div class="float-right flex flex-row items-center gap-2">
					<div class="flex flex-row items-center">
						<ModeSwitch :id="id" :current-mode="mode" />
						<span class="text-neutral-300">|</span>
					</div>

					<div class="ml-auto">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>
									<Button
										variant="ghost"
										class="h-full p-2"
										@click="
											() => {
												toast.success(t('EntitySidebar.copied'), {
													description: t('EntitySidebar.copiedMessage'),
												});
												copyEntity();
											}
										"
									>
										<span class="sr-only"> {{ t("EntitySidebar.copy") }}</span>
										<CopyIcon :size="16" />
									</Button>
								</TooltipTrigger>
								<TooltipContent>
									<span>{{ t("EntitySidebar.copy") }}</span>
								</TooltipContent>
							</Tooltip>
							<Tooltip>
								<TooltipTrigger>
									<Popover>
										<PopoverTrigger as-child>
											<Button variant="ghost" class="h-full p-2"
												><span class="sr-only"> {{ t("EntitySidebar.download") }}</span>
												<DownloadIcon :size="16" />
											</Button>
										</PopoverTrigger>
										<PopoverContent class="w-fit">
											<div class="text-xs text-muted-foreground">
												{{ t("EntitySidebar.format") }}
											</div>
											<Button
												v-for="format in exportFormats"
												:key="format[0]"
												variant="ghost"
												class="block w-full text-start"
												@click="exportEntity(format[0], format[2])"
												>{{ format[1] }}</Button
											>
										</PopoverContent>
									</Popover>
								</TooltipTrigger>
								<TooltipContent>
									<span>{{ t("EntitySidebar.download") }}</span>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<Button variant="ghost" class="h-full p-2" @click="clearSelection"
						><XIcon class="size-4"></XIcon
					></Button>
				</div>
				<EntityPrimaryDetails :entity="entity" @handled-relations="updateHandledRelations" />

				<slot name="custom-details" />
				<!-- <component v-if="hasCustomDetails" v-bind:is="entityDetailsDict" bind:entity-data /> -->

				<EntityDetails
					:handled-relations="handledRelations"
					:relations="nonEmptyRelations ?? {}"
					:entity="entity"
					class="rounded-md border px-4 py-3 text-sm"
				/>
			</div>
			<button
				class="absolute left-full top-1/2 -z-10 block -translate-x-2 rounded-md bg-[hsl(var(--card))] py-2 pl-1 shadow-md"
				style="top: calc(50% - 40px)"
				@click="expandedState = !expandedState"
			>
				<ChevronLeftIcon
					class="ml-auto size-8"
					:class="{ block: expandedState, hidden: !expandedState }"
				/>
				<ChevronRightIcon
					class="ml-auto size-8"
					:class="{ hidden: expandedState, block: !expandedState }"
				/>
				<span class="sr-only">{{ t("EntityPage.sidebar.toggle", { title: entity.title }) }}</span>
			</button>
		</div>
	</div>
</template>
