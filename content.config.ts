import { defineCollection, defineContentConfig, z } from "@nuxt/content";

export default defineContentConfig({
	collections: {
		systemPages: defineCollection({
			type: "page",
			source: "system-pages/**/*.md",
			schema: z.object({
				title: z.string(),
				navigation: z.object({ title: z.string() }),
				image: z.object({ light: z.string(), dark: z.string() }).optional(),
				leadIn: z.string().optional(),
				links: z.array(z.object({ label: z.string(), href: z.string() })).optional(),
			}),
		}),
		teamMembers: defineCollection({
			type: "page",
			source: "team/**/*.md",
			schema: z.object({
				firstName: z.string().optional(),
				lastName: z.string(),
				academicTitle: z.string().optional(),
				image: z.string().optional(),
			}),
		}),
		contentPages: defineCollection({
			type: "page",
			source: "pages/**/*.md",
			schema: z.object({
				title: z.string(),
				navigation: z.object({
					title: z.string(),
				}),
				toc: z.boolean(),
			}),
		}),
		cmsIntro: defineCollection({
			type: "page",
			source: "cms-intro/**/*.md",
			schema: z.object({
				title: z.string(),
				image: z.object({ light: z.string(), dark: z.string() }).optional(),
				links: z
					.array(z.object({ label: z.string(), href: z.string(), external: z.boolean() }))
					.optional(),
			}),
		}),
		docs: defineCollection({
			type: "page",
			source: "docs/**/*.md",
			schema: z.object({
				title: z.string(),
			}),
		}),
	},
});
