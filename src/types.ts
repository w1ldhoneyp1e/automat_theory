interface MealyTransition {
	from: string,
	to: string,
	input: string,
	output: string,
}

interface MealyMachine {
	states: string[],
	transitions: MealyTransition[],
}

interface MooreState {
	name: string,
	output: string,
}

interface MooreTransition {
	from: string,
	to: string,
	input: string,
}

interface MooreMachine {
	states: MooreState[],
	transitions: MooreTransition[],
}

interface DotNode {
	id: string,
	label?: string,
}

interface DotEdge {
	from: string,
	to: string,
	label?: string,
}

interface DotGraph {
	type: 'digraph' | 'graph',
	name?: string,
	nodes: DotNode[],
	edges: DotEdge[],
}

export {
	MealyTransition,
	MealyMachine,
	MooreState,
	MooreTransition,
	MooreMachine,
	DotNode,
	DotEdge,
	DotGraph,
}
