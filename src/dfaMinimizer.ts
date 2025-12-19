import {type DFA, type DFATransition} from './determinizer'

function getTransitionSignature(
	stateName: string,
	transitions: DFATransition[],
	partitions: string[][],
): string {
	const stateTransitions = transitions.filter(t => t.from === stateName)

	return stateTransitions
		.sort((a, b) => a.symbol.localeCompare(b.symbol))
		.map(t => {
			const targetPartitionIndex = partitions.findIndex(p => p.includes(t.to))
			return `${t.symbol}:${targetPartitionIndex}`
		})
		.join('|')
}

function splitPartitionByTransitions(
	partition: string[],
	transitions: DFATransition[],
	partitions: string[][],
): string[][] {
	if (partition.length === 1) {
		return [partition]
	}

	const transitionGroups = new Map<string, string[]>()

	for (const stateName of partition) {
		const signature = getTransitionSignature(stateName, transitions, partitions)

		if (!transitionGroups.has(signature)) {
			transitionGroups.set(signature, [])
		}
		transitionGroups.get(signature)!.push(stateName)
	}

	return Array.from(transitionGroups.values())
}

interface RefinePartitionsResults {
	partitions: string[][],
	changed: boolean,
}

function refinePartitions(
	partitions: string[][],
	transitions: DFATransition[],
): RefinePartitionsResults {
	let changed = false
	const newPartitions: string[][] = []

	for (const partition of partitions) {
		const split = splitPartitionByTransitions(partition, transitions, partitions)
		newPartitions.push(...split)
		if (split.length > 1) {
			changed = true
		}
	}

	return {
		partitions: newPartitions,
		changed,
	}
}

function minimizeDFA(dfa: DFA): DFA {
	const acceptStates = Array.from(dfa.acceptStates)
	const nonAcceptStates = Array.from(dfa.states).filter(
		s => !dfa.acceptStates.has(s),
	)

	let partitions: string[][] = []
	if (acceptStates.length > 0) {
		partitions.push(acceptStates)
	}
	if (nonAcceptStates.length > 0) {
		partitions.push(nonAcceptStates)
	}

	if (partitions.length === 0) {
		return dfa
	}

	let changed = true
	while (changed) {
		const result = refinePartitions(partitions, dfa.transitions)
		partitions = result.partitions
		changed = result.changed
	}

	let stateCounter = 0
	const stateMapping = new Map<string, string>()
	const newStateNames = new Map<string, string>()

	for (const partition of partitions) {
		const newStateName = `q${stateCounter++}`
		newStateNames.set(partition[0], newStateName)
		for (const oldStateName of partition) {
			stateMapping.set(oldStateName, newStateName)
		}
	}

	const minimizedStates = new Set<string>()
	const minimizedAcceptStates = new Set<string>()
	const minimizedTransitions: DFATransition[] = []

	for (const partition of partitions) {
		const newStateName = newStateNames.get(partition[0])!
		minimizedStates.add(newStateName)

		if (dfa.acceptStates.has(partition[0])) {
			minimizedAcceptStates.add(newStateName)
		}
	}

	const processedTransitions = new Set<string>()

	for (const transition of dfa.transitions) {
		const newFrom = stateMapping.get(transition.from)!
		const newTo = stateMapping.get(transition.to)!
		const transitionKey = `${newFrom}:${transition.symbol}:${newTo}`

		if (!processedTransitions.has(transitionKey)) {
			processedTransitions.add(transitionKey)
			minimizedTransitions.push({
				from: newFrom,
				to: newTo,
				symbol: transition.symbol,
			})
		}
	}

	return {
		states: minimizedStates,
		startState: stateMapping.get(dfa.startState)!,
		acceptStates: minimizedAcceptStates,
		transitions: minimizedTransitions,
	}
}

export {minimizeDFA}

