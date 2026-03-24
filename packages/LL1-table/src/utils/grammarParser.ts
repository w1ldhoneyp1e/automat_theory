import {type Grammar, type GrammarRule} from '../types'

function parseGrammar(input: string): Grammar {
	const rules: GrammarRule[] = []

	const lines = input
		.split('\n')
		.map(l => l.trim())
		.filter(l => l.length > 0 && !l.startsWith('//') && !l.startsWith('#'))

	for (const line of lines) {
		const arrowIdx = line.indexOf('->')
		if (arrowIdx === -1) {
			continue
		}

		const left = line.slice(0, arrowIdx).trim()
		if (!left) {
			continue
		}

		const rightStr = line.slice(arrowIdx + 2).trim()
		const alternatives = rightStr.split('|')

		for (const alt of alternatives) {
			const symbols = alt
				.trim()
				.split(/\s+/)
				.filter(Boolean)
				.map(s => (s === 'eps'
					? 'e'
					: s))

			const isEpsilon
        = symbols.length === 0
        || (symbols.length === 1 && symbols[0] === 'e')

			rules.push({
				left,
				right: isEpsilon
					? []
					: symbols.filter(s => s !== 'e'),
			})
		}
	}

	const nonterminals = [...new Set(rules.map(r => r.left))]
	const startSymbol = nonterminals[0] ?? ''

	const allSymbols = new Set<string>()
	for (const {right} of rules) {
		for (const sym of right) {
			allSymbols.add(sym)
		}
	}

	const terminals = [...allSymbols].filter(s => !nonterminals.includes(s))

	return {
		nonterminals,
		terminals,
		rules,
		startSymbol,
	}
}

function formatGrammar(grammar: Grammar): string {
	const grouped = new Map<string, string[][]>()
	for (const nt of grammar.nonterminals) {
		grouped.set(nt, [])
	}
	for (const {left, right} of grammar.rules) {
		grouped.get(left)?.push(right)
	}

	return grammar.nonterminals
		.map(nt => {
			const alts = grouped.get(nt) ?? []
			const rhs = alts.map(r => (r.length === 0
				? 'e'
				: r.join(' '))).join(' | ')

			return `${nt} -> ${rhs}`
		})
		.join('\n')
}

export {parseGrammar, formatGrammar}
