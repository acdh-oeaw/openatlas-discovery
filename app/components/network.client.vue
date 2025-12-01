<script setup lang="ts">
import { downloadAsImage } from "@sigma/export-image";
import type Graph from "graphology";
import circular from "graphology-layout/circular";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import { type Camera, Sigma } from "sigma";
import type { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { onMounted, ref } from "vue";

import { layoutOptions, networkConfig } from "@/config/network-visualisation.config";

interface State {
	hoveredNode?: string;

	// State derived from query:
	selectedNodes?: Array<{
		id: string;
		label: string;
	}>;

	// State derived from hovered node:
	hoveredNeighbors?: Set<string>;
}
const props = defineProps<{
	graph: Graph;
	searchNode?: string;
	detailNode?: string;
	showOrphans: boolean;
	networkContainerId: string;
}>();

interface NetworkContext {
	graph: Graph;
	renderer: Sigma | null;
	camera: Camera | null;
}

const context: NetworkContext = {
	graph: props.graph,
	renderer: null,
	camera: null,
};

circular.assign(context.graph);

const router = useRouter();
const route = useRoute();

function handleNetworkControls(eventType: string) {
	switch (eventType) {
		case "toggleRenderer":
			toggleRenderer();
			break;
		case "zoomIn":
			context.camera?.animatedZoom();
			break;
		case "zoomOut":
			context.camera?.animatedUnzoom();
			break;
		case "resetZoom":
			context.camera?.animatedReset();
			break;
		case "download":
			downloadCanvas();
			break;
		default:
			break;
	}
}

const isRunning = ref(true);

defineExpose({ handleNetworkControls, isRunning });

function toggleRenderer() {
	if (layout.isRunning()) {
		layout.stop();
		isRunning.value = false;
	} else {
		layout.start();
		isRunning.value = true;
	}
}

function downloadCanvas() {
	// WIP: add copyyright label to downloaded image

	/* const canvas = document.createElement("canvas");
	const ctx = canvas.getContext("2d");
	if (ctx) {
		ctx.font = "16px Arial";
		ctx.fillText("© " + t("Metadata.name"), 10, 80);
	}
	canvas.id = "copyright-canvas";
	document.body.append(canvas); */

	if (context.renderer != null) {
		void downloadAsImage(context.renderer, { backgroundColor: "#ffff" });
	}
}

let hoverTimeOut: ReturnType<typeof setTimeout>;

const state = ref<State>({});
const layout = new FA2LayoutSupervisor(context.graph, { settings: layoutOptions });

const disabledNodeColor = networkConfig.colors.disabledNodeColor;

function setSearchHighlight(searchNode: string) {
	context.graph.nodes().forEach((el) => {
		context.graph.removeNodeAttribute(el, "highlighted");
	});
	const query = searchNode.toLowerCase();

	if (query) {
		const results = context.graph
			.nodes()
			.map((n) => {
				return { id: n, label: context.graph.getNodeAttribute(n, "label") as string };
			})
			.filter(({ label }) => {
				return label.toLowerCase().includes(query);
			});

		if (results.length >= 1) {
			state.value.selectedNodes = results;
			state.value.selectedNodes.forEach((el) => {
				context.graph.setNodeAttribute(el.id, "highlighted", true);
			});
		}
	}
	// If the query is empty, then we reset the selectedNode
	else {
		state.value.selectedNodes = undefined;
	}

	// Refresh rendering
	// You can directly call `renderer.refresh()`, but if you need performances
	// you can provide some options to the refresh method.
	// In this case, we don't touch the graph data so we can skip its reindexation
	context.renderer?.refresh({
		skipIndexation: true,
	});
}

watch(
	() => {
		return props.showOrphans;
	},
	() => {
		nodeReducer();
	},
);

watch(
	() => {
		return props.detailNode;
	},
	(detailNode) => {
		if (detailNode) {
			context.graph.nodes().forEach((el) => {
				context.graph.removeNodeAttribute(el, "highlighted");
			});

			if (detailNode) {
				const results = context.graph
					.nodes()
					.map((n) => {
						return { id: n, label: context.graph.getNodeAttribute(n, "id") as string };
					})
					.filter(({ id }) => {
						return id === detailNode;
					});

				if (results.length === 1) {
					state.value.selectedNodes = results;
					state.value.selectedNodes.forEach((el) => {
						context.graph.setNodeAttribute(el.id, "highlighted", true);
					});
				}
			}
			// If the query is empty, then we reset the selectedNode
			else {
				state.value.selectedNodes = undefined;
			}

			// Refresh rendering
			// You can directly call `renderer.refresh()`, but if you need performances
			// you can provide some options to the refresh method.
			// In this case, we don't touch the graph data so we can skip its reindexation
			context.renderer?.refresh({
				skipIndexation: true,
			});
		}
	},
	{ immediate: true, deep: true },
);

watch(
	() => {
		return props.searchNode;
	},
	(searchNode) => {
		if (searchNode) {
			setSearchHighlight(searchNode);
		}
	},
	{ immediate: true, deep: true },
);

onMounted(async () => {
	layout.start();

	// await the layout algorithm so the initial circular layout does not flash for a sec
	await new Promise((r) => {
		return setTimeout(r, 100);
	});

	const container = document.getElementById(props.networkContainerId);
	if (container == null) return;

	context.renderer = new Sigma(context.graph, container, {
		minCameraRatio: 0.1,
		maxCameraRatio: 10,
	});

	context.camera = context.renderer.getCamera();

	if (props.searchNode) {
		setSearchHighlight(props.searchNode);
	}

	context.renderer.on("clickNode", ({ node }) => {
		void router.push({ query: { ...route.query, selection: node } });
	});

	context.renderer.on("enterNode", ({ node }) => {
		hoverTimeOut = setTimeout(() => {
			// context.graph.nodes().forEach((el) => {
			// 	context.graph.removeNodeAttribute(el, "highlighted");
			// });
			setHoveredNode(node);
			nodeReducer();
			edgeReducer();
		}, 300);
	});

	context.renderer.on("leaveNode", () => {
		clearTimeout(hoverTimeOut);
		setHoveredNode(undefined);
	});

	nodeReducer();
	edgeReducer();
});

function setHoveredNode(node?: string) {
	if (node) {
		state.value.hoveredNode = node;
		state.value.hoveredNeighbors = new Set(context.graph.neighbors(node));
	} else {
		state.value.hoveredNode = undefined;
		state.value.hoveredNeighbors = undefined;
	}

	// Refresh rendering:
	context.renderer?.refresh();
}

// Render nodes accordingly to the internal state:
// 1. If a node is selected, it is highlighted
// 2. If there is query, all non-matching nodes are greyed
// 3. If there is a hovered node, all non-neighbor nodes are greyed
function nodeReducer() {
	context.renderer?.setSetting("nodeReducer", (node, data) => {
		const res: Partial<NodeDisplayData> = { ...data };

		if (
			state.value.hoveredNeighbors &&
			!state.value.hoveredNeighbors.has(node) &&
			state.value.hoveredNode !== node
		) {
			res.label = "";
			res.color = disabledNodeColor;
		}

		if (props.showOrphans) {
			res.hidden = false;
		} else if (
			context.graph.neighbors(node).filter((n) => {
				return n !== node;
			}).length === 0
		) {
			res.hidden = true;
		}
		return res;
	});
}

// Render edges accordingly to the internal state:
// If a node is hovered, the edge is hidden if it is not connected to the
// node
function edgeReducer() {
	context.renderer?.setSetting("edgeReducer", (edge, data) => {
		const res: Partial<EdgeDisplayData> = { ...data };

		if (state.value.hoveredNode && !context.graph.hasExtremity(edge, state.value.hoveredNode)) {
			res.hidden = true;
		}

		if (context.graph.hasExtremity(edge, state.value.hoveredNode)) {
			const edgeTargetNode = context.graph.getNodeAttributes(context.graph.source(edge));

			return { ...data, color: edgeTargetNode.color, zIndex: 1 };
		}

		return res;
	});
}

onScopeDispose(() => {
	console.log("dispose network!");
	context.renderer?.kill();
	layout.kill();
	context.graph.clear();
	context.renderer = null;
	context.camera = null;
});
</script>

<template>
	<div :id="`${props.networkContainerId}`" class="relative m-0 size-full overflow-hidden p-0"></div>
</template>
