import {
	type DotEdge,
	type DotGraph,
	type DotNode,
} from '../types'

function parse(dotContent: string): DotGraph {
	const lines = dotContent.split('\n').map(line => line.trim())
		.filter(line => line)

	const headerMatch = lines[0].match(/^(digraph|graph)\s+(\w+)?\s*\{/)
	if (!headerMatch) {
		throw new Error('Неверный формат DOT файла')
	}

	const type = headerMatch[1] as 'digraph' | 'graph'
	const name = headerMatch[2]

	const nodes: DotNode[] = []
	const edges: DotEdge[] = []

	for (let i = 1; i < lines.length - 1; i++) {
		const line = lines[i]

		if (!line || line.startsWith('//')) {
			continue
		}

		const nodeMatch = line.match(/^(\w+)\s*\[label\s*=\s*"([^"]*)"\]/)
		if (nodeMatch) {
			nodes.push({
				id: nodeMatch[1],
				label: nodeMatch[2],
			})
			continue
		}

		const edgeMatch = line.match(/^(\w+)\s*->\s*(\w+)\s*\[label\s*=\s*"([^"]*)"\]/)
		if (edgeMatch) {
			edges.push({
				from: edgeMatch[1],
				to: edgeMatch[2],
				label: edgeMatch[3],
			})
			continue
		}
	}

	return {
		type,
		name,
		nodes,
		edges,
	}
}

function detectMachineType(graph: DotGraph): 'mealy' | 'moore' {
	const hasSlashInEdges = graph.edges.some(edge =>
		edge.label && edge.label.includes('/'),
	)

	if (hasSlashInEdges) {
		return 'mealy'
	}

	const hasSlashInNodes = graph.nodes.some(node =>
		node.label && node.label.includes('/'),
	)

	return hasSlashInNodes
		? 'moore'
		: 'mealy'
}

export {parse, detectMachineType}
