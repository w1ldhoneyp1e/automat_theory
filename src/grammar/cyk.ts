import {type Grammar} from '../types'

interface CykResult {
	belongs: boolean,
	table: string[][][],
}

function buildCykTable(grammar: Grammar, w: string): string[][][] {
	const n = w.length
	const table: string[][][] = Array.from({length: n}, (_, i) =>
		Array.from({length: n - i}, () => []),
	)

	for (let i = 0; i < n; i++) {
		for (const rule of grammar.rules) {
			if (rule.right.length === 1 && rule.right[0] === w[i] && !table[i][0].includes(rule.left)) {
				table[i][0].push(rule.left)
			}
		}
	}

	for (let len = 2; len <= n; len++) {
		for (let i = 0; i <= n - len; i++) {
			const cell = collectNonterminals(grammar, table, i, len)
			table[i][len - 1] = cell
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
	if (w.length === 0) {
		const belongs = grammar.rules.some(
			r => r.right.length === 0 && r.left === grammar.startSymbol,
		)
		return {
			belongs,
			table: [],
		}
	}

	const table = buildCykTable(grammar, w)
	const belongs = table[0][w.length - 1].includes(grammar.startSymbol)

	return {
		belongs,
		table,
	}
}

export {
	cyk,
	type CykResult,
}
