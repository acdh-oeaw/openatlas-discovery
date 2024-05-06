<script setup lang="ts">
import type Graph from "graphology";
import circular from "graphology-layout/circular";
import FA2LayoutSupervisor from "graphology-layout-forceatlas2/worker";
import Sigma, { type Camera } from "sigma";
import type { EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { nextTick, onMounted, ref } from "vue";

import { layoutOptions } from "@/config/network-visualisation.config";

interface State {
	hoveredNode?: string;
	searchQuery: string;

	// State derived from query:
	selectedNode?: string;
	suggestions?: Set<string>;

	// State derived from hovered node:
	hoveredNeighbors?: Set<string>;
}
const props = defineProps<{
	graph: Graph;
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

const locale = useLocale();
const router = useRouter();
let hoverTimeOut: ReturnType<typeof setTimeout>;

// let searchInput = "";

let draggedNode = null as string | null;
let isDragging = false;

const state = ref<State>({ searchQuery: "" });
const layout = new FA2LayoutSupervisor(context.graph, { settings: layoutOptions });

onMounted(async () => {
	await nextTick();

	layout.start();

	const container = document.getElementById("sigma-container");
	if (container == null) return;

	context.renderer = new Sigma(context.graph, container, {
		minCameraRatio: 0.1,
		maxCameraRatio: 10,
	});

	context.camera = context.renderer.getCamera();

	context.renderer.on("clickNode", ({ node }) => {
		void router.push(`/${locale.value}/entities/` + node);
	});

	context.renderer.on("enterNode", ({ node }) => {
		hoverTimeOut = setTimeout(() => {
			setHoveredNode(node);
			nodeReducer();
			edgeReducer();
		}, 300);
	});

	context.renderer.on("leaveNode", () => {
		clearTimeout(hoverTimeOut);
		setHoveredNode(undefined);
	});

	context.renderer.on("downNode", (e) => {
		isDragging = true;
		draggedNode = e.node;
		context.graph.setNodeAttribute(draggedNode, "highlighted", true);
	});

	context.renderer.getMouseCaptor().on("mousemovebody", (e) => {
		if (!isDragging || !draggedNode) return;

		// Get new position of node
		const pos = context.renderer?.viewportToGraph(e);

		context.graph.setNodeAttribute(draggedNode, "x", pos?.x);
		context.graph.setNodeAttribute(draggedNode, "y", pos?.y);

		// Prevent sigma to move camera:
		e.preventSigmaDefault();
		e.original.preventDefault();
		e.original.stopPropagation();
	});

	// On mouse up, we reset the autoscale and the dragging mode
	context.renderer.getMouseCaptor().on("mouseup", () => {
		if (draggedNode) {
			context.graph.removeNodeAttribute(draggedNode, "highlighted");
		}
		isDragging = false;
		draggedNode = null;
	});

	// Disable the autoscale at the first down interaction
	context.renderer.getMouseCaptor().on("mousedown", () => {
		if (!context.renderer?.getCustomBBox())
			context.renderer?.setCustomBBox(context.renderer.getBBox());
	});
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
			res.color = "rgb(400, 400, 400)";
		}

		if (state.value.selectedNode === node) {
			res.highlighted = true;
		} else if (state.value.suggestions && !state.value.suggestions.has(node)) {
			res.label = "";
			res.color = "rgb(400, 400, 400)";
		}

		return res;
	});
}

// Render edges accordingly to the internal state:
// 1. If a node is hovered, the edge is hidden if it is not connected to the
//    node
// 2. If there is a query, the edge is only visible if it connects two
//    suggestions
function edgeReducer() {
	context.renderer?.setSetting("edgeReducer", (edge, data) => {
		const res: Partial<EdgeDisplayData> = { ...data };

		if (state.value.hoveredNode && !context.graph.hasExtremity(edge, state.value.hoveredNode)) {
			res.hidden = true;
		}

		if (
			state.value.suggestions &&
			(!state.value.suggestions.has(context.graph.source(edge)) ||
				!state.value.suggestions.has(context.graph.target(edge)))
		) {
			res.color = "rgb(400, 400, 400)";
		}

		return res;
	});
}

// Bind zoom manipulation buttons

function zoom() {
	context.camera?.animatedZoom({ duration: 600 });
}

function unZoom() {
	context.camera?.animatedUnzoom({ duration: 600 });
}

function resetZoom() {
	context.camera?.animatedReset({ duration: 600 });
}

onScopeDispose(() => {
	context.renderer?.kill();
	layout.kill();
	context.graph.clear();
	context.renderer = null;
	context.camera = null;
});
</script>

<template>
	<div id="sigma-container" class="relative m-0 size-full overflow-hidden p-0"></div>
</template>
