import {type MealyMachine, type MealyTransition} from '../types'
import {createStateMapping} from './utils'

function getTransitionSignature(
	stateName: string,
	transitions: MealyTransition[],
	partitions: string[][],
): string {
	const stateTransitions = transitions.filter(t => t.from === stateName)

	return stateTransitions
		.sort((a, b) => a.input.localeCompare(b.input))
		.map(t => {
			const targetPartitionIndex = partitions.findIndex(p => p.includes(t.to))
			return `${t.input}:${targetPartitionIndex}:${t.output}`
		})
		.join('|')
}

function splitPartitionByTransitions(
	partition: string[],
	transitions: MealyTransition[],
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
	transitions: MealyTransition[],
): RefinePartitionsResults {
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
	states: string[],
	stateMapping: Map<string, string>,
): string[] {
	const minimizedStates: string[] = []
	const addedStates = new Set<string>()

	states.forEach(state => {
		const newStateName = stateMapping.get(state)!
		if (!addedStates.has(newStateName)) {
			minimizedStates.push(newStateName)
			addedStates.add(newStateName)
		}
	})

	return minimizedStates
}

function buildMinimizedTransitions(
	transitions: MealyTransition[],
	stateMapping: Map<string, string>,
): MealyTransition[] {
	const minimizedTransitions: MealyTransition[] = []
	const addedTransitions = new Set<string>()

	transitions.forEach(transition => {
		const newFrom = stateMapping.get(transition.from)!
		const newTo = stateMapping.get(transition.to)!
		const transitionKey = `${newFrom}-${transition.input}-${newTo}-${transition.output}`

		if (!addedTransitions.has(transitionKey)) {
			minimizedTransitions.push({
				from: newFrom,
				to: newTo,
				input: transition.input,
				output: transition.output,
			})
			addedTransitions.add(transitionKey)
		}
	})

	return minimizedTransitions
}

function minimizeMealy(machine: MealyMachine): MealyMachine {
	const {states, transitions} = machine

	let partitions: string[][] = [states]
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
	minimizeMealy,
}

