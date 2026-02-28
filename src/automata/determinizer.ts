import {type NFA, type NFATransition} from '../regex/to-nfa'
import {type MealyMachine, type MealyTransition} from '../types'

function stateSetToString(stateSet: Set<string>): string {
	const sortedStates = Array.from(stateSet).sort()
	if (sortedStates.length === 1) {
		return sortedStates[0]
	}
	return `{${sortedStates.join(',')}}`
}

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

interface DFA {
	states: Set<string>,
	startState: string,
	acceptStates: Set<string>,
	transitions: DFATransition[],
}

interface DFATransition {
	from: string,
	to: string,
	symbol: string,
}

function epsilonClosure(nfa: NFA, states: Set<string>): Set<string> {
	const closure = new Set<string>(states)
	const queue = Array.from(states)

	while (queue.length > 0) {
		const state = queue.shift()!
		const epsilonTransitions = nfa.transitions.filter(
			t => t.from === state && t.symbol === 'e',
		)

		for (const transition of epsilonTransitions) {
			if (!closure.has(transition.to)) {
				closure.add(transition.to)
				queue.push(transition.to)
			}
		}
	}

	return closure
}

function move(nfa: NFA, states: Set<string>, symbol: string): Set<string> {
	const result = new Set<string>()

	for (const state of states) {
		const transitions = nfa.transitions.filter(
			t => t.from === state && t.symbol === symbol,
		)
		for (const transition of transitions) {
			result.add(transition.to)
		}
	}

	return result
}

function determinizeNFA(nfa: NFA): DFA {
	const initialStateSet = epsilonClosure(nfa, new Set([nfa.startState]))

	let stateCounter = 0
	const stateSetToName = new Map<string, string>()
	const nameToStateSet = new Map<string, Set<string>>()

	const getStateName = (stateSet: Set<string>): string => {
		const stateSetKey = stateSetToString(stateSet)
		if (!stateSetToName.has(stateSetKey)) {
			const newName = `q${stateCounter++}`
			stateSetToName.set(stateSetKey, newName)
			nameToStateSet.set(newName, stateSet)
		}
		return stateSetToName.get(stateSetKey)!
	}

	const initialStateName = getStateName(initialStateSet)
	const dfaStates = new Set<string>([initialStateName])
	const dfaTransitions: DFATransition[] = []

	const queue = [initialStateName]
	const processed = new Set<string>()

	const alphabet = new Set<string>()
	for (const transition of nfa.transitions) {
		if (transition.symbol !== 'e') {
			alphabet.add(transition.symbol)
		}
	}

	while (queue.length > 0) {
		const currentStateName = queue.shift()!

		if (processed.has(currentStateName)) {
			continue
		}
		processed.add(currentStateName)

		const currentStateSet = nameToStateSet.get(currentStateName)!

		for (const symbol of alphabet) {
			const nextStateSet = epsilonClosure(nfa, move(nfa, currentStateSet, symbol))

			if (nextStateSet.size === 0) {
				continue
			}

			const nextStateName = getStateName(nextStateSet)

			if (!dfaStates.has(nextStateName)) {
				dfaStates.add(nextStateName)
				queue.push(nextStateName)
			}

			dfaTransitions.push({
				from: currentStateName,
				to: nextStateName,
				symbol,
			})
		}
	}

	const dfaAcceptStates = new Set<string>()
	for (const [stateName, stateSet] of nameToStateSet) {
		for (const nfaAcceptState of nfa.acceptStates) {
			if (stateSet.has(nfaAcceptState)) {
				dfaAcceptStates.add(stateName)
				break
			}
		}
	}

	return {
		states: dfaStates,
		startState: initialStateName,
		acceptStates: dfaAcceptStates,
		transitions: dfaTransitions,
	}
}

function dfaToDot(dfa: DFA): string {
	const header = 'digraph DFA {\n  rankdir=LR;\n  node [shape=circle];\n'
	const startNode = `  start [shape=point];\n  start -> ${dfa.startState};\n`
	const acceptNodes = Array.from(dfa.acceptStates)
		.map(state => `  ${state} [shape=doublecircle];\n`)
		.join('')
	const transitions = dfa.transitions
		.map(transition => `  ${transition.from} -> ${transition.to} [label="${transition.symbol}"];\n`)
		.join('')
	const footer = '}\n'

	return header + startNode + acceptNodes + transitions + footer
}

export {
	determinizeMealy,
	determinizeNFA,
	dfaToDot,
	isMealyDeterministic,
}
export type {DFA, DFATransition}

