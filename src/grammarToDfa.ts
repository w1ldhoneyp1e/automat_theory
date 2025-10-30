import {
	type Grammar,
	type GrammarRule,
	type MealyMachine,
	type MealyTransition,
} from './types'

function grammarToDFA(grammar: Grammar): MealyMachine {
	validateRegularGrammar(grammar)

	const states: string[] = []
	const transitions: MealyTransition[] = []
	const stateMap = new Map<string, Set<string>>()

	const initialState = `q0`
	const initialClosure = computeClosure(grammar, new Set([grammar.startSymbol]))
	states.push(initialState)
	stateMap.set(initialState, initialClosure)

	const queue = [initialState]
	const processed = new Set<string>()

	while (queue.length > 0) {
		const currentState = queue.shift()!
		if (processed.has(currentState)) {
			continue
		}
		processed.add(currentState)

		const currentClosure = stateMap.get(currentState)!

		for (const terminal of grammar.terminals) {
			const nextClosure = computeTransition(grammar, currentClosure, terminal)

			if (nextClosure.size > 0) {
				let targetState = findStateWithClosure(stateMap, nextClosure)

				if (!targetState) {
					targetState = `q${states.length}`
					states.push(targetState)
					stateMap.set(targetState, nextClosure)
					queue.push(targetState)
				}

				transitions.push({
					from: currentState,
					to: targetState,
					input: terminal,
					output: '',
				})
			}
		}
	}

	return {
		states,
		transitions,
	}
}

function computeClosure(grammar: Grammar, nonterminals: Set<string>): Set<string> {
	const closure = new Set(nonterminals)
	let changed = true

	while (changed) {
		changed = false
		const newNonterminals = new Set(closure)

		for (const rule of grammar.rules) {
			if (closure.has(rule.left) && rule.right.length > 0) {
				const firstSymbol = rule.right[0]
				if (grammar.nonterminals.includes(firstSymbol) && !closure.has(firstSymbol)) {
					newNonterminals.add(firstSymbol)
					changed = true
				}
			}
		}

		if (changed) {
			for (const nt of newNonterminals) {
				closure.add(nt)
			}
		}
	}

	return closure
}

function computeTransition(grammar: Grammar, closure: Set<string>, symbol: string): Set<string> {
	const result = new Set<string>()

	for (const nonterminal of closure) {
		for (const rule of grammar.rules) {
			if (rule.left === nonterminal && rule.right.length > 0 && rule.right[0] === symbol) {
				addTransitionResult(grammar, rule, result)
			}
		}
	}

	return computeClosure(grammar, result)
}

function addTransitionResult(grammar: Grammar, rule: GrammarRule, result: Set<string>): void {
	if (rule.right.length === 1) {
		result.add('FINAL')
	}
	else if (rule.right.length === 2) {
		const nextNonterminal = rule.right[1]
		if (grammar.nonterminals.includes(nextNonterminal)) {
			result.add(nextNonterminal)
		}
	}
}

function findStateWithClosure(stateMap: Map<string, Set<string>>, closure: Set<string>): string | null {
	for (const [state, stateClosure] of stateMap) {
		if (setsEqual(stateClosure, closure)) {
			return state
		}
	}
	return null
}

function setsEqual(set1: Set<string>, set2: Set<string>): boolean {
	if (set1.size !== set2.size) {
		return false
	}
	for (const item of set1) {
		if (!set2.has(item)) {
			return false
		}
	}
	return true
}

function validateRegularGrammar(grammar: Grammar): void {
	for (const rule of grammar.rules) {
		if (rule.right.length === 0) {
			continue
		}

		if (rule.right.length === 1) {
			if (!grammar.terminals.includes(rule.right[0])) {
				throw new Error(`Правило ${rule.left} -> ${rule.right.join('')} не является регулярным`)
			}
			continue
		}

		if (rule.right.length === 2) {
			if (!grammar.terminals.includes(rule.right[0])
				|| !grammar.nonterminals.includes(rule.right[1])) {
				throw new Error(`Правило ${rule.left} -> ${rule.right.join('')} не является регулярным`)
			}
			continue
		}

		throw new Error(`Правило ${rule.left} -> ${rule.right.join('')} не является регулярным`)
	}
}

function dfaToDot(dfa: MealyMachine): string {
	let dot = `digraph {\n`
	dot += `  node [shape=circle];\n`

	for (const state of dfa.states) {
		const isFinal = state.includes('FINAL') || state === 'q0'
		const shape = isFinal
			? 'doublecircle'
			: 'circle'
		dot += `  ${state} [shape=${shape}];\n`
	}

	dot += `  start [shape=point];\n`
	dot += `  start -> q0;\n`

	for (const transition of dfa.transitions) {
		const label = transition.output
			? `${transition.input}/${transition.output}`
			: transition.input
		dot += `  ${transition.from} -> ${transition.to} [label="${label}"];\n`
	}

	dot += '}\n'
	return dot
}

export {
	grammarToDFA,
	dfaToDot,
}
