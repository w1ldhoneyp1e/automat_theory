import {type Grammar} from '../types'

interface CykResult {
	belongs: boolean,
	table: string[][][],
	tokens: string[],
}

function tokenizeInput(text: string, terminals: string[]): string[] {
	const hasMultiChar = terminals.some(t => t.length > 1)
	if (!hasMultiChar) {
		return text.split('')
	}
	const sorted = [...terminals].sort((a, b) => b.length - a.length)
	const tokens: string[] = []
	let i = 0
	while (i < text.length) {
		let matched = false
		for (const t of sorted) {
			if (text.startsWith(t, i)) {
				tokens.push(t)
				i += t.length
				matched = true
				break
			}
		}
		if (!matched) {
			tokens.push(text[i])
			i++
		}
	}
	return tokens
}

function buildCykTable(grammar: Grammar, tokens: string[]): string[][][] {
	const n = tokens.length
	const table: string[][][] = Array.from({length: n}, (_, i) =>
		Array.from({length: n - i}, () => []),
	)

	for (let i = 0; i < n; i++) {
		for (const rule of grammar.rules) {
			if (rule.right.length === 1 && rule.right[0] === tokens[i] && !table[i][0].includes(rule.left)) {
				table[i][0].push(rule.left)
			}
		}
	}

	for (let len = 2; len <= n; len++) {
		for (let i = 0; i <= n - len; i++) {
			table[i][len - 1] = collectNonterminals(grammar, table, i, len)
		}
	}

	return table
}

function collectNonterminals(
	grammar: Grammar,
	table: string[][][],
	i: number,
	len: number,
): string[] {
	const cell: string[] = []
	for (let k = i; k < i + len - 1; k++) {
		const leftLen = k - i + 1
		const rightLen = len - leftLen
		const leftNts = table[i][leftLen - 1]
		const rightNts = table[k + 1][rightLen - 1]
		for (const rule of grammar.rules) {
			if (
				rule.right.length === 2
				&& leftNts.includes(rule.right[0])
				&& rightNts.includes(rule.right[1])
				&& !cell.includes(rule.left)
			) {
				cell.push(rule.left)
			}
		}
	}
	return cell
}

function cyk(grammar: Grammar, w: string): CykResult {
	const tokens = tokenizeInput(w, grammar.terminals)

	if (tokens.length === 0) {
		const belongs = grammar.rules.some(
			r => r.right.length === 0 && r.left === grammar.startSymbol,
		)
		return {
			belongs,
			table: [],
			tokens: [],
		}
	}

	const table = buildCykTable(grammar, tokens)
	const belongs = table[0][tokens.length - 1].includes(grammar.startSymbol)

	return {
		belongs,
		table,
		tokens,
	}
}

export {
	cyk,
	tokenizeInput,
	type CykResult,
}
