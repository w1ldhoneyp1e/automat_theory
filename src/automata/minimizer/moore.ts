import {
	type MooreMachine,
	type MooreState,
	type MooreTransition,
} from '../../types'
import {createStateMapping} from './utils'

function groupStatesByOutput(states: MooreState[]): string[][] {
	const outputGroups = new Map<string, string[]>()
	states.forEach(state => {
		const output = state.output
		if (!outputGroups.has(output)) {
			outputGroups.set(output, [])
		}
		outputGroups.get(output)!.push(state.name)
	})
	return Array.from(outputGroups.values())
}

function getTransitionSignature(
	stateName: string,
	transitions: MooreTransition[],
	partitions: string[][],
): string {
	const stateTransitions = transitions.filter(t => t.from === stateName)

	return stateTransitions
		.sort((a, b) => a.input.localeCompare(b.input))
		.map(t => {
			const targetPartitionIndex = partitions.findIndex(p => p.includes(t.to))
			return `${t.input}:${targetPartitionIndex}`
		})
		.join('|')
}

function splitPartitionByTransitions(
	partition: string[],
	transitions: MooreTransition[],
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

function refinePartitions(
	partitions: string[][],
	transitions: MooreTransition[],
): {
		partitions: string[][],
		changed: boolean,
	} {
	const newPartitions: string[][] = []
	let changed = false

	for (const partition of partitions) {
		const splitResult = splitPartitionByTransitions(partition, transitions, partitions)

		if (splitResult.length > 1) {
			changed = true
		}

		newPartitions.push(...splitResult)
	}

	return {
		partitions: newPartitions,
		changed,
	}
}

function buildMinimizedStates(
	states: MooreState[],
	stateMapping: Map<string, string>,
): MooreState[] {
	const minimizedStates: MooreState[] = []
	const addedStates = new Set<string>()

	states.forEach(state => {
		const newStateName = stateMapping.get(state.name)!
		if (!addedStates.has(newStateName)) {
			minimizedStates.push({
				name: newStateName,
				output: state.output,
			})
			addedStates.add(newStateName)
		}
	})

	return minimizedStates
}

function buildMinimizedTransitions(
	transitions: MooreTransition[],
	stateMapping: Map<string, string>,
): MooreTransition[] {
	const minimizedTransitions: MooreTransition[] = []
	const addedTransitions = new Set<string>()

	transitions.forEach(transition => {
		const newFrom = stateMapping.get(transition.from)!
		const newTo = stateMapping.get(transition.to)!
		const transitionKey = `${newFrom}-${transition.input}-${newTo}`

		if (!addedTransitions.has(transitionKey)) {
			minimizedTransitions.push({
				from: newFrom,
				to: newTo,
				input: transition.input,
			})
			addedTransitions.add(transitionKey)
		}
	})

	return minimizedTransitions
}

function minimizeMoore(machine: MooreMachine): MooreMachine {
	const {states, transitions} = machine

	let partitions = groupStatesByOutput(states)
	let changed = true

	while (changed) {
		const result = refinePartitions(partitions, transitions)
		partitions = result.partitions
		changed = result.changed
	}

	const stateMapping = createStateMapping(partitions)
	const minimizedStates = buildMinimizedStates(states, stateMapping)
	const minimizedTransitions = buildMinimizedTransitions(transitions, stateMapping)

	return {
		states: minimizedStates,
		transitions: minimizedTransitions,
	}
}

export {
	minimizeMoore,
}

