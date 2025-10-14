<script setup lang="ts">
import type { PresentationViewModel, RelatedEntityModel } from "@/types/api";

const props = defineProps<{
	entity: PresentationViewModel;
}>();

const composition = "crm:P46_is_composed_of";

function getComposedEntitesRecursive(
	entitiesToCheck: Array<PresentationViewModel | RelatedEntityModel>,
	allEntities: Array<RelatedEntityModel>,
): Array<RelatedEntityModel> {
	const composedEntites: Array<RelatedEntityModel> = entitiesToCheck
		.filter((entity) => {
			return entity != null;
		})
		.flatMap((entity) => {
			return allEntities.filter((relatedEntity) => {
				return relatedEntity?.relationTypes?.find((relation) => {
					return relation?.property === composition && relation.relationTo === entity.id;
				});
			});
		});
	if (composedEntites.length > 0)
		return [...getComposedEntitesRecursive(composedEntites, allEntities), ...composedEntites];
	return composedEntites;
}

const hierarchy = computed(() => {
	const composedEntites = getComposedEntitesRecursive(
		[props.entity],
		Object.values(props.entity.relations ?? {}).flat(),
	);
	return composedEntites;
});
const route = useRoute();

function getPath() {
	if (route.path.includes("visualization")) {
		return "visualization";
	}
	return "";
}

const currentMode = computed(() => {
	return route.query.mode;
});

const hiddenHierarchy = computed(() => {
	return hierarchy.value.slice(1);
});
</script>

<template>
	<Breadcrumb v-if="hierarchy.length > 0">
		<BreadcrumbList class="gap-0 sm:gap-0">
			<BreadcrumbItem v-if="hierarchy[0]">
				<NavLink
					v-if="hierarchy[0]?.id"
					class="underline decoration-dotted hover:no-underline"
					:href="{
						path: `/${getPath()}`,
						query: {
							mode: currentMode,
							selection: hierarchy[0]?.id,
						},
					}"
				>
					{{ hierarchy[0].title }}
				</NavLink>
				<span v-else>
					{{ hierarchy[0].title }}
				</span>
			</BreadcrumbItem>
			<BreadcrumbSeparator v-if="hiddenHierarchy.length > 0" />
			<BreadcrumbItem v-if="hiddenHierarchy.length > 1">
				<DropdownMenu>
					<DropdownMenuTrigger class="flex items-center gap-1">
						<BreadcrumbEllipsis class="size-4" />
						<span class="sr-only">Toggle menu</span>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							v-for="(hierarchyItem, index) in hiddenHierarchy"
							:key="hierarchyItem?.title ?? index"
						>
							<NavLink
								v-if="hierarchyItem?.id"
								class="underline decoration-dotted hover:no-underline"
								:href="{
									path: `/${getPath()}`,
									query: {
										mode: currentMode,
										selection: hierarchyItem.id,
									},
								}"
							>
								{{ hierarchyItem.title }}
							</NavLink>
							<span v-else>
								{{ hierarchyItem?.title }}
							</span>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</BreadcrumbItem>
			<BreadcrumbItem v-else-if="hiddenHierarchy.length === 1 && hiddenHierarchy[0]">
				<NavLink
					v-if="hiddenHierarchy[0].id"
					class="underline decoration-dotted hover:no-underline"
					:href="{
						path: `/${getPath()}`,
						query: {
							mode: currentMode,
							selection: hiddenHierarchy[0].id,
						},
					}"
				>
					{{ hiddenHierarchy[0].title }}
				</NavLink>
				<span v-else>
					{{ hiddenHierarchy[0].title }}
				</span>
			</BreadcrumbItem>
			<BreadcrumbSeparator />
			<BreadcrumbItem>
				<NavLink
					v-if="entity.id"
					class="underline decoration-dotted hover:no-underline"
					:href="{
						path: `/${getPath()}`,
						query: {
							mode: currentMode,
							selection: String(entity.id),
						},
					}"
				>
					{{ entity.title }}
				</NavLink>
				<span v-else>
					{{ entity?.title }}
				</span>
			</BreadcrumbItem>
		</BreadcrumbList>
	</Breadcrumb>
</template>
