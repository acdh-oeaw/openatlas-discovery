export interface NetworkNode {
	key: string;
	attributes: {
		label: string | undefined;
		color: string | undefined;
		size: number;
	};
}

export interface NetworkEdge {
	source: string;
	target: string;
}
