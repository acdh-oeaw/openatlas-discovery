<script setup lang="ts">
import { CopyIcon, DownloadIcon, QuoteIcon, XIcon } from "lucide-vue-next";

import { toast } from "@/components/ui/toast";
import type { ExportEntityParams } from "@/composables/use-export-entity";

const t = useTranslations();
const route = useRoute();
const router = useRouter();

const props = defineProps<{
	id: number;
	mode: string;
	open: boolean;
}>();

function clearSelection() {
	closeDrawer(() => {
		const query = { ...route.query };
		delete query.selection;

		void router.push({
			path: route.path,
			query,
		});
	});
}

const emit = defineEmits<{
	"update:open": [value: boolean];
}>();

const { data, isPending } = useGetEntity(
	computed(() => {
		return { entityId: props.id };
	}),
);

const isLoading = computed(() => {
	return isPending.value;
});

const entity = computed(() => {
	return data.value;
});

const handledRelations = ref<Array<RelationType>>([]);

const updateHandledRelations = (relations: Array<RelationType>) => {
	handledRelations.value = [...relations];
};

const permaLink = computed(() => {
	const fullUrl = window.location.href;
	const baseUrl = fullUrl.split(route.path)[0];
	if (baseUrl) {
		return `${baseUrl}/entity/${route.query.selection as string}`;
	} else return null;
});

function copyEntity() {
	if (permaLink.value) {
		return navigator.clipboard.writeText(permaLink.value);
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

const nonEmptyRelations = computed(() => {
	if (!entity.value?.relations) return null;
	const filteredEntries = Object.entries(entity.value.relations).filter(([_, value]) => {
		return value.length > 0;
	});
	return filteredEntries.length > 0 ? Object.fromEntries(filteredEntries) : null;
});

const isClosed = ref(false);

let timer: ReturnType<typeof setTimeout> | null = null;
let timer2: ReturnType<typeof setTimeout> | null = null;

function closeDrawer(afterClose?: () => void) {
	isClosed.value = true;
	timer = setTimeout(() => {
		emit("update:open", false);
		if (afterClose) afterClose();
	}, 500);
}

onScopeDispose(() => {
	if (timer) clearTimeout(timer);
	if (timer2) clearTimeout(timer2);
});

watch(
	() => props.open,
	async (newVal) => {
		if (newVal) {
			isClosed.value = true;
			nextTick(() => {
				timer2 = setTimeout(() => {
					isClosed.value = false;
				}, 0);
			});
		} else {
			closeDrawer();
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div v-if="open">
		<div
			class="fixed inset-x-0 bottom-0 z-100 flex h-full transform flex-col overflow-y-auto border-t bg-background shadow-lg transition-transform duration-500 ease-in-out"
			:class="{ 'translate-y-0': !isClosed, 'translate-y-full': isClosed }"
		>
			<div class="inset-x-0 bottom-0 h-full w-full overflow-y-auto p-0">
				<div class="flex w-full max-w-full flex-col px-4 pt-4">
					<div class="ml-auto flex items-center justify-between gap-2">
						<!-- in the current mobile layout there is no mode switch because the drawer will be filling the whole page 
                            TODO: in later versions a more advanced mobile layout could be implemented 
                        -->
						<div class="flex items-center gap-2">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Popover>
											<PopoverTrigger>
												<Button variant="ghost" class="h-full p-2">
													<span class="sr-only"> {{ t("EntitySidebar.permalink") }}</span>
													<QuoteIcon :size="16" />
												</Button>
											</PopoverTrigger>
											<PopoverContent>
												<Label for="permaLink" class="pb-0.5 pl-0.5 text-xs text-muted-foreground">
													{{ t("EntitySidebar.permalink") }}
												</Label>
												<div class="inline-flex gap-2">
													<Input id="permaLink" :default-value="permaLink ?? ''" readonly />
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
															<TooltipContent>{{ t("EntitySidebar.copy") }}</TooltipContent>
														</Tooltip>
													</TooltipProvider>
												</div>
											</PopoverContent>
										</Popover>
									</TooltipTrigger>
									<TooltipContent>
										<span>{{ t("EntitySidebar.permalink") }}</span>
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
											<PopoverContent class="w-fit items-start">
												<div class="text-center text-xs text-muted-foreground">
													{{ t("EntitySidebar.format") }}
												</div>
												<Button
													v-for="format in exportFormats"
													:key="format[0]"
													variant="ghost"
													class="block w-full text-xs"
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
							<Button
								class="rounded p-2 hover:bg-gray-100"
								aria-label="Close"
								variant="transparent"
								@click="clearSelection"
							>
								<XIcon :size="20" />
							</Button>
						</div>
					</div>

				<Centered v-if="isLoading" class="pointer-events-none">
					<LoadingIndicator class="text-neutral-200" size="lg" />
				</Centered>
				<div v-if="entity != null && !isLoading">
					<!-- Entity Content -->
					<EntityPrimaryDetails
						v-if="entity"
						:entity="entity"
						@handled-relations="updateHandledRelations"
					/>

					<slot name="custom-details" />

					<EntityDetails
						v-if="entity"
						:handled-relations="handledRelations"
						:relations="nonEmptyRelations ?? {}"
						:entity="entity"
						class="rounded-md border px-4 py-3 text-sm"
					/>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>
