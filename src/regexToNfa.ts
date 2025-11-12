import {type ParseNode, parseRegex} from './regexParser'

interface NFATransition {
	from: string,
	to: string,
	symbol: string,
}

interface NFA {
	states: Set<string>,
	startState: string,
	acceptStates: Set<string>,
	transitions: NFATransition[],
}

function buildConcat(nfa1: NFA, nfa2: NFA): NFA {
	const transitions = [
		...nfa1.transitions,
		...nfa2.transitions,
	]

	for (const acceptState of nfa1.acceptStates) {
		transitions.push({
			from: acceptState,
			to: nfa2.startState,
			symbol: 'e',
		})
	}

	return {
		states: new Set([...nfa1.states, ...nfa2.states]),
		startState: nfa1.startState,
		acceptStates: nfa2.acceptStates,
		transitions,
	}
}

function buildChar(symbol: string, newState: () => string): NFA {
	const start = newState()
	const accept = newState()

	return {
		states: new Set([start, accept]),
		startState: start,
		acceptStates: new Set([accept]),
		transitions: [{
			from: start,
			to: accept,
			symbol,
		}],
	}
}

function buildUnion(nfa1: NFA, nfa2: NFA, newState: () => string): NFA {
	const newStart = newState()
	const newAccept = newState()

	const transitions = [
		...nfa1.transitions,
		...nfa2.transitions,
	]

	transitions.push({
		from: newStart,
		to: nfa1.startState,
		symbol: 'e',
	})
	transitions.push({
		from: newStart,
		to: nfa2.startState,
		symbol: 'e',
	})

	for (const acceptState of nfa1.acceptStates) {
		transitions.push({
			from: acceptState,
			to: newAccept,
			symbol: 'e',
		})
	}
	for (const acceptState of nfa2.acceptStates) {
		transitions.push({
			from: acceptState,
			to: newAccept,
			symbol: 'e',
		})
	}

	return {
		states: new Set([newStart, newAccept, ...nfa1.states, ...nfa2.states]),
		startState: newStart,
		acceptStates: new Set([newAccept]),
		transitions,
	}
}

function buildStarSimple(symbol: string, newState: () => string): NFA {
	const state = newState()

	return {
		states: new Set([state]),
		startState: state,
		acceptStates: new Set([state]),
		transitions: [{
			from: state,
			to: state,
			symbol,
		}],
	}
}

function buildStar(nfa: NFA, newState: () => string): NFA {
	const newStart = newState()
	const newAccept = newState()

	const transitions = [...nfa.transitions]

	transitions.push({
		from: newStart,
		to: nfa.startState,
		symbol: 'e',
	})

	transitions.push({
		from: newStart,
		to: newAccept,
		symbol: 'e',
	})

	for (const acceptState of nfa.acceptStates) {
		transitions.push({
			from: acceptState,
			to: newAccept,
			symbol: 'e',
		})
	}

	transitions.push({
		from: newAccept,
		to: newStart,
		symbol: 'e',
	})

	return {
		states: new Set([newStart, newAccept, ...nfa.states]),
		startState: newStart,
		acceptStates: new Set([newAccept]),
		transitions,
	}
}

function buildFromAST(
	node: ParseNode,
	newState: () => string,
): NFA {
	switch (node.type) {
		case 'char':
			return buildChar(node.value!, newState)
		case 'concat':
			return buildConcat(
				buildFromAST(node.children![0], newState),
				buildFromAST(node.children![1], newState),
			)
		case 'union':
			return buildUnion(
				buildFromAST(node.children![0], newState),
				buildFromAST(node.children![1], newState),
				newState,
			)
		case 'star': {
			const child = node.children![0]
			if (child.type === 'char') {
				return buildStarSimple(child.value!, newState)
			}
			return buildStar(buildFromAST(child, newState), newState)
		}
		default:
			throw new Error(`Неизвестный тип узла: ${(node as any).type}`)
	}
}

function regexToNFA(regex: string): NFA {
	let stateCounter = 0
	const getNewState = (): string => `q${stateCounter++}`

	const ast = parseRegex(regex)
	return buildFromAST(ast, getNewState)
}

function nfaToDot(nfa: NFA): string {
	const header = 'digraph NFA {\n  rankdir=LR;\n  node [shape=circle];\n'
	const startNode = `  start [shape=point];\n  start -> ${nfa.startState};\n`
	const acceptNodes = Array.from(nfa.acceptStates)
		.map(state => `  ${state} [shape=doublecircle];\n`)
		.join('')
	const transitions = nfa.transitions
		.map(transition => {
			const label = transition.symbol === 'e'
				? 'e'
				: transition.symbol
			return `  ${transition.from} -> ${transition.to} [label="${label}"];\n`
		})
		.join('')
	const footer = '}\n'

	return header + startNode + acceptNodes + transitions + footer
}

export {
	regexToNFA,
	nfaToDot,
	type NFA,
	type NFATransition,
}

