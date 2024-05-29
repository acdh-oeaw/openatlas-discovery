import { cva, type VariantProps } from "class-variance-authority";

export { default as Toggle } from "./Toggle.vue";

export const toggleVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-black hover:text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:bg-black data-[state=on]:text-white",
	{
		variants: {
			variant: {
				default: "bg-muted text-black",
				outline:
					"border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground",
			},
			size: {
				default: "h-9 px-3",
				sm: "h-8 px-2",
				lg: "h-10 px-3",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	},
);

export type ToggleVariants = VariantProps<typeof toggleVariants>;
