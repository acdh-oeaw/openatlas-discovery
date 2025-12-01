<script lang="ts" setup>
const _props = defineProps<{
	datespans: Array<{ start: string | null; end: string | null }>;
}>();

const t = useTranslations();
</script>

<template>
	<div>
		<template v-if="datespans.length > 0">
			<template v-for="(timespan, index) of datespans" :key="index">
				<dl class="flex gap-12">
					<div v-if="timespan.start != null">
						<dt class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							{{ t("TimespansDisplay.start") }}
						</dt>
						<dd>{{ timespan.start }}</dd>
					</div>
					<div v-if="timespan.end != null">
						<dt class="text-xs font-medium uppercase tracking-wider text-muted-foreground">
							{{ t("TimespansDisplay.end") }}
						</dt>
						<dd>{{ timespan.end }}</dd>
					</div>
				</dl>
			</template>
		</template>
		<template v-else>
			<!-- <div class="italic">{{ t("TimespansDisplay.no-dates") }}</div> -->
		</template>
	</div>
</template>
