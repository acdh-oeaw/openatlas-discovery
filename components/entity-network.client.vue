<script setup lang="ts">
import Graph from "graphology";
import Sigma, { type Camera } from "sigma";
import type { Coordinates, EdgeDisplayData, NodeDisplayData } from "sigma/types";
import { nextTick, onMounted, ref } from "vue";
import { z } from "zod";

const router = useRouter();
const route = useRoute();

interface State {
	hoveredNode?: string;
	searchQuery: string;

	// State derived from query:
	selectedNode?: string;
	suggestions?: Set<string>;

	// State derived from hovered node:
	hoveredNeighbors?: Set<string>;
}

const { data, isPending, isPlaceholderData } = useGetSearchResults(
	computed(() => {
		const { search, category, ...params } = searchFilters.value;

		return {
			...params,
			search:
				search.length > 0
					? [{ [category]: [{ operator: "like", values: [search], logicalOperator: "and" }] }]
					: [],
			type_id: [],
			view_classes: ["actor", "event", "place", "reference", "source"],
			limit: 0,
		};
	}),
);

const entities = computed(() => {
	return (
		data.value?.results.flatMap((result) => {
			return result.features;
		}) ?? []
	);
});

const entitiesById = computed(() => {
	return keyByToMap(entities.value, (entity) => {
		return entity.properties._id;
	});
});


const graph = new Graph();
graph.import();

let searchInput = "";

let draggedNode = null as string | null;
let isDragging = false;

let renderer = null as Sigma | null;
let camera = null as Camera | null;
const state = ref<State>({ searchQuery: "" });

onMounted(async () => {
	await nextTick(() => {
		const container = document.getElementById("sigma-container")!;
		renderer = new Sigma(graph, container, {
			minCameraRatio: 0.1,
			maxCameraRatio: 10,
		});
		camera = renderer.getCamera();

		renderer.on("enterNode", ({ node }) => {
			setHoveredNode(node);
			nodeReducer();
			edgeReducer();
		});

		renderer.on("leaveNode", () => {
			setHoveredNode(undefined);
		});

		renderer.on("downNode", (e) => {
			isDragging = true;
			draggedNode = e.node;
			graph.setNodeAttribute(draggedNode, "highlighted", true);
		});

		renderer.getMouseCaptor().on("mousemovebody", (e) => {
			if (!isDragging || !draggedNode) return;

			// Get new position of node
			const pos = renderer?.viewportToGraph(e);

			graph.setNodeAttribute(draggedNode, "x", pos?.x);
			graph.setNodeAttribute(draggedNode, "y", pos?.y);

			// Prevent sigma to move camera:
			e.preventSigmaDefault();
			e.original.preventDefault();
			e.original.stopPropagation();
		});

		// On mouse up, we reset the autoscale and the dragging mode
		renderer.getMouseCaptor().on("mouseup", () => {
			if (draggedNode) {
				graph.removeNodeAttribute(draggedNode, "highlighted");
			}
			isDragging = false;
			draggedNode = null;
		});

		// Disable the autoscale at the first down interaction
		renderer.getMouseCaptor().on("mousedown", () => {
			if (!renderer?.getCustomBBox()) renderer?.setCustomBBox(renderer.getBBox());
		});

		const searchSuggestions = document.getElementById("suggestions") as HTMLDataListElement;
		searchSuggestions.innerHTML = graph
			.nodes()
			.map((node) => {
				return `<option value="${graph.getNodeAttribute(node, "label")}"></option>`;
			})
			.join("\n");
	});
});

// Bind search input interactions:
function search(searchInput: string) {
	setSearchQuery(searchInput || "");
}

function setSearchQuery(query: string) {
	state.value.searchQuery = query;

	if (query) {
		const lcQuery = query.toLowerCase();
		const suggestions = graph
			.nodes()
			.map((n) => {
				return {
					id: n,
					label: graph.getNodeAttribute(n, "label") as string,
				};
			})
			.filter(({ label }) => {
				return label.toLowerCase().includes(lcQuery);
			});

		// If we have a single perfect match, them we remove the suggestions, and
		// we consider the user has selected a node through the datalist
		// autocomplete:
		if (suggestions.length === 1 && suggestions[0].label === query) {
			state.value.selectedNode = suggestions[0].id;
			state.value.suggestions = undefined;

			// Move the camera to center it on the selected node:
			const nodePosition = renderer?.getNodeDisplayData(state.value.selectedNode) as Coordinates;
			renderer?.getCamera().animate(nodePosition, {
				duration: 500,
			});
		}
		// Else, we display the suggestions list:
		else {
			state.value.selectedNode = undefined;
			state.value.suggestions = new Set(
				suggestions.map(({ id }) => {
					return id;
				}),
			);
		}
	}
	// If the query is empty, then we reset the selectedNode / suggestions state:
	else {
		state.value.selectedNode = undefined;
		state.value.suggestions = undefined;
	}

	// Refresh rendering:
	renderer?.refresh();
}
// Actions:

function setHoveredNode(node?: string) {
	console.log("entered.");
	if (node) {
		state.value.hoveredNode = node;
		state.value.hoveredNeighbors = new Set(graph.neighbors(node));
	} else {
		state.value.hoveredNode = undefined;
		state.value.hoveredNeighbors = undefined;
	}

	// Refresh rendering:
	renderer?.refresh();
}

// Render nodes accordingly to the internal state:
// 1. If a node is selected, it is highlighted
// 2. If there is query, all non-matching nodes are greyed
// 3. If there is a hovered node, all non-neighbor nodes are greyed
function nodeReducer() {
	renderer?.setSetting("nodeReducer", (node, data) => {
		console.log("Node ", node);
		console.log("Data ", data);
		const res: Partial<NodeDisplayData> = { ...data };

		console.log("Result", res);

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
	renderer?.setSetting("edgeReducer", (edge, data) => {
		const res: Partial<EdgeDisplayData> = { ...data };

		if (state.value.hoveredNode && !graph.hasExtremity(edge, state.value.hoveredNode)) {
			res.color = "rgb(400, 400, 400)";
		}

		if (
			state.value.suggestions &&
			(!state.value.suggestions.has(graph.source(edge)) ||
				!state.value.suggestions.has(graph.target(edge)))
		) {
			res.color = "rgb(400, 400, 400)";
		}

		return res;
	});
}

// Bind zoom manipulation buttons

function zoom() {
	camera?.animatedZoom({ duration: 600 });
}

function unZoom() {
	camera?.animatedUnzoom({ duration: 600 });
}

function resetZoom() {
	camera?.animatedReset({ duration: 600 });
}
</script>

<template>
	<div id="sigma-container"></div>
	<div id="search">
		<input
			id="search-input"
			v-model="searchInput"
			aria-label="search"
			type="search"
			list="suggestions"
			placeholder="Try searching for a node..."
			@input="search(searchInput)"
		/>
		<datalist id="suggestions"></datalist>
	</div>
	<div id="controls">
		<div class="input">
			<label for="zoom-in">Zoom in</label>
			<button id="zoom-in" @click="zoom">+</button>
		</div>
		<div class="input">
			<label for="zoom-out">Zoom out</label>
			<button id="zoom-out" @click="unZoom">-</button>
		</div>
		<div class="input">
			<label for="zoom-reset">Reset zoom</label>
			<button id="zoom-reset" @click="resetZoom">⊙</button>
		</div>
	</div>
</template>

<style scoped>
body {
	font-family: sans-serif;
}

html,
body,
#sigma-container {
	overflow: hidden;
	width: 100vw;
	height: 100vh;
	margin: 0;
	padding: 0;
}

#controls {
	position: absolute;
	top: 1em;
	right: 1em;
	text-align: right;
}

.input {
	position: relative;
	display: inline-block;
	vertical-align: middle;
}

.input:not(:hover) label {
	display: none;
}

.input label {
	position: absolute;
	top: 100%;
	left: 50%;
	margin-top: 0.3em;
	padding: 0.2em;
	border-radius: 2px;
	background: black;
	color: #fff;
	font-size: 0.8em;
	white-space: nowrap;
	transform: translateX(-50%);
}

.input button {
	display: inline-block;
	width: 2.5em;
	height: 2.5em;
	border: 1px solid dimgrey;
	border-radius: 2px;
	background: white;
	outline: none;
	text-align: center;
	cursor: pointer;
}

#search {
	position: absolute;
	top: 1em;
	left: 1em;
}
</style>
