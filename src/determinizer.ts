import {type MealyMachine, type MealyTransition} from './types'

function determinizeMealy(machine: MealyMachine): MealyMachine {
	if (isMealyDeterministic(machine)) {
		return machine
	}

	const inputs = Array.from(new Set(machine.transitions.map(t => t.input)))
	const initialState = machine.states[0]
	const processedStates = new Set<string>()
	const newStates: string[] = []
	const newTransitions: MealyTransition[] = []
	const queue: Set<string>[] = [new Set([initialState])]

	const stateSetToString = (stateSet: Set<string>): string => {
		const sortedStates = Array.from(stateSet).sort()
		if (sortedStates.length === 1) {
			return sortedStates[0]
		}
		return `{${sortedStates.join(',')}}`
	}

	const getTransitions = (stateSet: Set<string>, input: string): MealyTransition[] => {
		const transitions: MealyTransition[] = []
		for (const state of stateSet) {
			const stateTransitions = machine.transitions.filter(
				t => t.from === state && t.input === input,
			)
			transitions.push(...stateTransitions)
		}
		return transitions
	}

	while (queue.length > 0) {
		const currentStateSet = queue.shift()!
		const currentStateName = stateSetToString(currentStateSet)

		if (processedStates.has(currentStateName)) {
			continue
		}

		processedStates.add(currentStateName)
		newStates.push(currentStateName)

		for (const input of inputs) {
			const transitions = getTransitions(currentStateSet, input)

			if (transitions.length === 0) {
				continue
			}

			const targetStates = new Set<string>()
			const outputs: string[] = []

			for (const transition of transitions) {
				targetStates.add(transition.to)
				outputs.push(transition.output)
			}

			const sortedOutputs = Array.from(new Set(outputs)).sort()
			const selectedOutput = sortedOutputs[0]
			const targetStateName = stateSetToString(targetStates)

			newTransitions.push({
				from: currentStateName,
				to: targetStateName,
				input,
				output: selectedOutput,
			})

			if (!processedStates.has(targetStateName)) {
				queue.push(targetStates)
			}
		}
	}

	return {
		states: newStates,
		transitions: newTransitions,
	}
}

function isMealyDeterministic(machine: MealyMachine): boolean {
	const transitionMap = new Map<string, number>()

	for (const transition of machine.transitions) {
		const key = `${transition.from}:${transition.input}`
		const count = (transitionMap.get(key) || 0) + 1
		transitionMap.set(key, count)

		if (count > 1) {
			return false
		}
	}

	return true
}

export {
	determinizeMealy,
	isMealyDeterministic,
}

