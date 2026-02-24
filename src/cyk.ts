import {type Grammar} from './types'

interface CykResult {
	belongs: boolean,
	table: string[][][],
}

function buildCykTable(grammar: Grammar, w: string): string[][][] {
	const n = w.length
	const table: string[][][] = []

	for (let i = 0; i < n; i++) {
		table[i] = []
		for (let len = 1; len <= n - i; len++) {
			table[i][len - 1] = []
		}
	}

	for (let i = 0; i < n; i++) {
		const a = w[i]
		for (const rule of grammar.rules) {
			if (rule.right.length === 1 && rule.right[0] === a) {
				if (!table[i][0].includes(rule.left)) {
					table[i][0].push(rule.left)
				}
			}
		}
	}

	for (let len = 2; len <= n; len++) {
		for (let i = 0; i <= n - len; i++) {
			const j = i + len - 1
			const cell: string[] = []
			for (let k = i; k < j; k++) {
				const leftLen = k - i + 1
				const rightLen = j - k
				const leftNts = table[i][leftLen - 1]
				const rightNts = table[k + 1][rightLen - 1]
				for (const rule of grammar.rules) {
					if (rule.right.length !== 2) {
						continue
					}
					if (leftNts.includes(rule.right[0]) && rightNts.includes(rule.right[1])) {
						if (!cell.includes(rule.left)) {
							cell.push(rule.left)
						}
					}
				}
			}
			table[i][len - 1] = cell
		}
	}

	return table
}

function cyk(grammar: Grammar, w: string): CykResult {
	if (w.length === 0) {
		const hasEpsilon = grammar.rules.some(r => r.right.length === 0 && r.left === grammar.startSymbol)
		return {
			belongs: hasEpsilon,
			table: [],
		}
	}

	const table = buildCykTable(grammar, w)
	const topCell = table[0][w.length - 1]
	const belongs = topCell.includes(grammar.startSymbol)

	return {
		belongs,
		table,
	}
}

export {
	cyk,
	type CykResult,
}
