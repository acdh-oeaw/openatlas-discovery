import { cva, type VariantProps } from "class-variance-authority";

export { default as Toggle } from "./Toggle.vue";

export const toggleVariants = cva(
	"inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors hover:bg-muted hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 data-[state=on]:text-primary-foreground dark:text-black",
	{
		variants: {
			variant: {
				default:
					"bg-transparent  data-[state=on]:bg-primary  dark:bg-white dark:hover:bg-black  dark:hover:text-white dark:data-[state=on]:bg-black dark:data-[state=on]:text-white",
				outline:
					"border border-input bg-transparent shadow-sm hover:bg-accent hover:text-accent-foreground  data-[state=on]:bg-primary  dark:bg-white dark:hover:bg-black  dark:hover:text-white dark:data-[state=on]:bg-black dark:data-[state=on]:text-white",
				iiif: "bg-muted text-primary shadow hover:bg-primary hover:text-primary-foreground  data-[state=on]:bg-primary dark:bg-transparent dark:text-white  hover:dark:bg-muted dark:hover:text-white  dark:data-[state=on]:bg-black dark:data-[state=on]:text-white",
				legend: `bg-muted text-primary shadow hover:bg-[var(--customBackgroundColor)] hover:text-primary-foreground data-[state=on]:bg-[var(--customBackgroundColor)] dark:text-white dark:hover:text-white dark:data-[state=on]:text-white`,
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
