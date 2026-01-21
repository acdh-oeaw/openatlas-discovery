<script lang="ts" setup>
import { isNonEmptyString, noop } from "@acdh-oeaw/lib";
import { useQuery } from "@tanstack/vue-query";
import { User2Icon as UserIcon } from "lucide-vue-next";

const locale = useLocale();
const t = useTranslations();

const {
	data: team,
	error,
	suspense,
} = useQuery({
	queryKey: ["teamMembers", locale, "index"] as const,
	queryFn: async () => {
		const members = await queryCollection("teamMembers")
			.where("id", "LIKE", `teamMembers/team/${locale.value}/%`)
			.all();

		return members ?? null;
	},
});
useErrorMessage(error, {
	notFound: t("TeamPage.error.not-found"),
	unknown: t("TeamPage.error.unknown"),
});
onServerPrefetch(async () => {
	/**
	 * Delegate errors to the client, to avoid displaying error page with status code 500.
	 *
	 * @see https://github.com/TanStack/query/issues/6606
	 * @see https://github.com/TanStack/query/issues/5976
	 */
	await suspense().catch(noop);
});

const leads = computed(() => {
	if (!team.value) return null;
	return team.value
		.filter((m) => m.isLead === true)
		.toSorted((a, z) => a.lastName.localeCompare(z.lastName));
});

const nonLeads = computed(() => {
	if (!team.value) return null;
	return team.value
		.filter((m) => m.isLead !== true)
		.toSorted((a, z) => a.lastName.localeCompare(z.lastName));
});
</script>

<template>
	<template v-if="leads || nonLeads">
		<section v-if="leads && leads.length > 0" aria-labelledby="team-leads">
			<h2 id="team-leads" class="sr-only">
				{{ t("TeamPage.leads") }}
			</h2>

			<ul class="grid gap-8 pt-4 lg:grid-cols-2" role="list">
				<li v-for="member of leads" :key="member.id">
					<article class="prose prose-sm">
						<div
							class="not-prose relative grid size-20 place-items-center overflow-hidden rounded-full border-2 border-foreground"
						>
							<img
								v-if="member.image != null"
								alt=""
								class="absolute inset-0 size-full object-cover"
								:src="member.image"
							/>
							<UserIcon v-else class="size-10" />
						</div>
						<h3 class="mt-5">
							{{
								[member.academicTitle, member.firstName, member.lastName]
									.filter(isNonEmptyString)
									.join(" ")
							}}
						</h3>
						<ContentRenderer :value="member">
							<template #empty></template>
						</ContentRenderer>
					</article>
				</li>
			</ul>
		</section>

		<hr class="my-4 border-b border-foreground/30" />

		<section v-if="nonLeads && nonLeads.length > 0" aria-labelledby="team-members">
			<h2 id="team-members" class="sr-only">
				{{ t("TeamPage.members") }}
			</h2>

			<ul class="grid gap-8 py-4 lg:grid-cols-2" role="list">
				<li v-for="member of nonLeads" :key="member.id">
					<article class="prose prose-sm">
						<div
							class="not-prose relative grid size-20 place-items-center overflow-hidden rounded-full border-2 border-foreground"
						>
							<img
								v-if="member.image != null"
								alt=""
								class="absolute inset-0 size-full object-cover"
								:src="member.image"
							/>
							<UserIcon v-else class="size-10" />
						</div>
						<h3 class="mt-5">
							{{
								[member.academicTitle, member.firstName, member.lastName]
									.filter(isNonEmptyString)
									.join(" ")
							}}
						</h3>
						<ContentRenderer :value="member">
							<template #empty></template>
						</ContentRenderer>
					</article>
				</li>
			</ul>
		</section>
	</template>
</template>
