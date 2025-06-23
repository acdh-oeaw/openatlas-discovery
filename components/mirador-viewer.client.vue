<script lang="ts" setup>
import { assert } from "@acdh-oeaw/lib";
import Mirador from "mirador";

const props = defineProps<{
	config: { window: object };
	images: Array<string>;
	id: string;
	allowMaximize: boolean;
}>();

const route = useRoute();
const router = useRouter();

interface ActionType {
	type: unknown;
	[x: number | string | symbol]: unknown;
}

interface MiradorViewerInstance {
	store: {
		getState: () => { windows: object };
		subscribe: (listener: () => void) => void;
		dispatch: (action: ActionType) => void;
	};
}

const currentMode = ref("");

function changeMode(mode: string) {
	void router.push({
		query: { mode: mode, selection: route.query.selection, image: props.images[0] },
	});
}

// function getId(url: string) {
// 	return url.split("/").slice(-1)[0];
// }
const prevFullscreen = ref(false);

let miradorInstance = ref<MiradorViewerInstance | null>(null);

async function initializeMirador() {
	await nextTick();

	const windows = props.images.map((url) => {
		return { manifestId: url };
	});

	miradorInstance.value =
		Mirador.viewer({
			...props.config,
			window: {
				...props.config.window,
				allowMaximize: props.allowMaximize,
			},
			id: props.id,
			windows,
		}) ?? {};

	// Save original dispatch
	assert(miradorInstance.value);
	const store = miradorInstance.value.store;
	const originalDispatch = store.dispatch.bind(store);

	const actions = Mirador.actions;
	let state = miradorInstance.value.store.getState();
	if (!("windows" in (state as object))) return;
	const windowId = Object.keys(state.windows)[0];

	if (props.id === "miradorFullscreen") {
		miradorInstance.value.store.dispatch({
			id: "annotations-window",
			type: "mirador/ADD_COMPANION_WINDOW",
			windowId,
			payload: {
				content: "annotations",
				position: "right",
			},
		});
		miradorInstance.value.store.dispatch({
			id: "annotations-window",
			type: "mirador/UPDATE_COMPANION_WINDOW",
			windowId,
			payload: {
				content: "annotations",
				position: "right",
			},
		});
	}

	miradorInstance.value.store.subscribe(() => {
		// Override dispatch with a wrapper that intercepts the action
		store.dispatch = (action) => {
			// Make sure action is defined and has type
			if (action.type === actions.removeWindow().type) {
				delete route.query.image;
				router.go(-1);
			} else {
				originalDispatch(action);
			}
		};
		assert(miradorInstance.value);
		state = miradorInstance.value.store.getState();
		const isFullscreen =
			Object.entries(state.windows).length > 0
				? Object.entries(state.windows)[0]?.[1]?.maximized
				: false;
		if (isFullscreen !== prevFullscreen.value) {
			prevFullscreen.value = isFullscreen;

			if (isFullscreen) {
				currentMode.value = route.query.mode as string;
				changeMode("images");
			} else {
				changeMode(currentMode.value);
			}
		}
	});
}
onMounted(async () => {
	await initializeMirador();
});

watch(
	() => {
		return props.allowMaximize;
	},
	async () => {
		await initializeMirador();
	},
);
</script>

<template>
	<div :id="props.id" class="relative" />
</template>
