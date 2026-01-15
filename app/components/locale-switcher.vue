<script lang="ts" setup>
import { locales } from "@/config/i18n.config";

const currentLocale = useLocale();
const t = useTranslations();
const switchLocalePath = useSwitchLocalePath();
const { setLocale } = useI18n();
const route = useRoute();
const labels = computed(() => {
	return new Intl.DisplayNames([currentLocale.value], { type: "language" });
});
</script>

<template>
	<!-- Mobile: Dropdown Menu -->
	<div class="lg:hidden">
		<DropdownMenu>
			<DropdownMenuTrigger as-child>
				<Button class="gap-2" size="icon" variant="ghost">
					<span class="sr-only">{{ t("LocaleSwitcher.switch-locale", { locale: labels.of(currentLocale) }) }}</span>
					<span aria-hidden="true" class="text-sm font-medium">{{ currentLocale.toUpperCase() }}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					v-for="locale of locales"
					:key="locale"
					@click="
						() => {
							setLocale(locale);
						}
					"
				>
					{{ labels.of(locale) }}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</div>

	<!-- Desktop: Text Links -->
	<div class="hidden items-center gap-2 lg:flex">
		<template v-for="(locale, index) of locales" :key="locale">
			<span v-if="index !== 0" class="opacity-80">|</span>

			<NuxtLink
				v-if="locale !== currentLocale"
				class="opacity-80 transition-opacity hover:opacity-100 focus-visible:opacity-100"
				:href="{ path: switchLocalePath(locale), query: route.query }"
				@click.prevent.stop="setLocale(locale)"
			>
				<span class="sr-only">
					{{ t("LocaleSwitcher.switch-locale", { locale: labels.of(locale) }) }}
				</span>
				<span aria-hidden="true">{{ locale.toUpperCase() }}</span>
			</NuxtLink>
			<span v-else class="cursor-default font-semibold">
				<span class="sr-only">
					{{ t("LocaleSwitcher.current-locale", { locale: labels.of(locale) }) }}
				</span>
				<span aria-hidden="true">{{ locale.toUpperCase() }}</span>
			</span>
		</template>
	</div>
</template>
