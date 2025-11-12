interface ParseNode {
	type: 'char' | 'concat' | 'union' | 'star',
	value?: string,
	children?: ParseNode[],
}

interface ParseState {
	input: string,
	pos: number,
}

function parseRegex(input: string): ParseNode {
	const parts = input.trim().split('=')
	if (parts.length > 2) {
		throw new Error()
	}

	const hasEquality = parts.length === 2
	const afterEqualSymbolPartIndex = 1
	const onlyPartIndex = 0

	const regexInput = parts[hasEquality
		? afterEqualSymbolPartIndex
		: onlyPartIndex]

	const state: ParseState = {
		input: regexInput,
		pos: 0,
	}
	const [expr, finalState] = parseExpression(state)

	skipWhitespace(finalState)
	if (finalState.pos < finalState.input.length) {
		throw new Error(`Неожиданный символ в позиции ${finalState.pos}: ${finalState.input[finalState.pos]}`)
	}

	return expr
}

function skipWhitespace(state: ParseState): void {
	while (state.pos < state.input.length && /\s/.test(state.input[state.pos])) {
		state.pos++
	}
}

function parseConcatenation(state: ParseState): [ParseNode, ParseState] {
	skipWhitespace(state)
	if (state.pos >= state.input.length) {
		throw new Error('Неожиданный конец выражения')
	}

	if (state.input[state.pos] === '(') {
		state.pos++
		skipWhitespace(state)
		const [expr, newState] = parseExpression(state)
		skipWhitespace(newState)
		if (newState.pos >= newState.input.length || newState.input[newState.pos] !== ')') {
			throw new Error('Ожидалась закрывающая скобка')
		}
		newState.pos++
		return [expr, newState]
	}

	const char = state.input[state.pos]
	state.pos++
	return [{
		type: 'char',
		value: char,
	}, state]
}

function parseUnion(state: ParseState): [ParseNode, ParseState] {
	const concatenations: ParseNode[] = []
	let currentState = state

	while (true) {
		skipWhitespace(currentState)
		if (currentState.pos >= currentState.input.length) {
			break
		}

		const char = currentState.input[currentState.pos]
		if (char === '|' || char === '+' || char === ')') {
			break
		}

		let [concatenation, concatenationState] = parseConcatenation(currentState)

		while (concatenationState.pos < concatenationState.input.length
			&& concatenationState.input[concatenationState.pos] === '*') {
			concatenationState.pos++
			concatenation = {
				type: 'star',
				children: [concatenation],
			}
		}

		concatenations.push(concatenation)
		currentState = concatenationState

		skipWhitespace(currentState)
		if (currentState.pos >= currentState.input.length) {
			break
		}

		const nextChar = currentState.input[currentState.pos]
		if (nextChar === '|' || nextChar === '+' || nextChar === ')') {
			break
		}
	}

	if (concatenations.length === 0) {
		throw new Error('Ожидалась часть объединения')
	}

	if (concatenations.length === 1) {
		return [concatenations[0], currentState]
	}

	const union = concatenations.reduce((left, right) => ({
		type: 'concat',
		children: [left, right],
	}))

	return [union, currentState]
}

function parseExpression(state: ParseState): [ParseNode, ParseState] {
	const unions: ParseNode[] = []
	let currentState = state

	while (true) {
		const [union, unionState] = parseUnion(currentState)
		unions.push(union)
		currentState = unionState

		if (currentState.pos >= currentState.input.length) {
			break
		}

		const char = currentState.input[currentState.pos]
		if (char === '|' || char === '+') {
			currentState.pos++
			continue
		}

		if (char === ')') {
			break
		}

		break
	}

	let result: ParseNode
	if (unions.length === 1) {
		result = unions[0]
	}
	else {
		result = unions.reduce((left, right) => ({
			type: 'union',
			children: [left, right],
		}))
	}

	return [result, currentState]
}

export {
	type ParseNode,
	parseRegex,
}
