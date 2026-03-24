import {type Grammar, type GrammarRule} from '../types'

function findFreeName(base: string, taken: string[]): string {
	if (!taken.includes(base)) {
		return base
	}
	let name = base + '\''
	while (taken.includes(name)) {
		name += '\''
	}

	return name
}

function recomputeTerminals(rules: GrammarRule[], nonterminals: string[]): string[] {
	const allSymbols = new Set<string>()
	for (const {right} of rules) {
		for (const sym of right) {
			allSymbols.add(sym)
		}
	}

	return [...allSymbols].filter(s => !nonterminals.includes(s))
}

function eliminateDirectLeftRecursion(grammar: Grammar): {
	grammar: Grammar,
	eliminated: boolean,
} {
	let rules: GrammarRule[] = [...grammar.rules]
	const nonterminals: string[] = [...grammar.nonterminals]
	let eliminated = false

	for (const A of [...grammar.nonterminals]) {
		const aRules = rules.filter(r => r.left === A)
		const recursive = aRules.filter(r => r.right.length > 0 && r.right[0] === A)
		const nonRecursive = aRules.filter(r => r.right.length === 0 || r.right[0] !== A)

		if (recursive.length === 0) {
			continue
		}

		eliminated = true
		const newNT = findFreeName(A + '\'', nonterminals)
		nonterminals.push(newNT)

		rules = rules.filter(r => r.left !== A)

		for (const nr of nonRecursive) {
			rules.push({
				left: A,
				right: [...nr.right, newNT],
			})
		}

		for (const r of recursive) {
			rules.push({
				left: newNT,
				right: [...r.right.slice(1), newNT],
			})
		}

		rules.push({
			left: newNT,
			right: [],
		})
	}

	return {
		grammar: {
			nonterminals,
			terminals: recomputeTerminals(rules, nonterminals),
			rules,
			startSymbol: grammar.startSymbol,
		},
		eliminated,
	}
}

function addNewAxiom(grammar: Grammar): {
	grammar: Grammar,
	added: boolean,
} {
	const startUsedInBody = grammar.rules.some(r =>
		r.right.includes(grammar.startSymbol),
	)

	if (!startUsedInBody) {
		return {
			grammar,
			added: false,
		}
	}

	const newStart = findFreeName('Z', grammar.nonterminals)

	return {
		grammar: {
			nonterminals: [newStart, ...grammar.nonterminals],
			terminals: grammar.terminals,
			rules: [{
				left: newStart,
				right: [grammar.startSymbol],
			}, ...grammar.rules],
			startSymbol: newStart,
		},
		added: true,
	}
}

function longestCommonPrefix(seqs: string[][]): string[] {
	if (seqs.length === 0) {
		return []
	}
	let prefix = [...seqs[0]]
	for (const seq of seqs.slice(1)) {
		let i = 0
		while (i < prefix.length && i < seq.length && prefix[i] === seq[i]) {
			i++
		}
		prefix = prefix.slice(0, i)
		if (prefix.length === 0) {
			break
		}
	}

	return prefix
}

function leftFactor(grammar: Grammar): {
	grammar: Grammar,
	factorized: boolean,
} {
	let rules: GrammarRule[] = [...grammar.rules]
	const nonterminals: string[] = [...grammar.nonterminals]
	let factorized = false

	let changed = true
	while (changed) {
		changed = false

		for (const nt of [...nonterminals]) {
			const ntRules = rules.filter(r => r.left === nt)

			const groups = new Map<string, string[][]>()
			for (const rule of ntRules) {
				const key = rule.right.length === 0
					? ''
					: rule.right[0]
				if (!groups.has(key)) {
					groups.set(key, [])
				}
				groups.get(key)!.push(rule.right)
			}

			for (const [firstSym, alts] of groups) {
				if (firstSym === '' || alts.length <= 1) {
					continue
				}

				const lcp = longestCommonPrefix(alts)
				if (lcp.length === 0) {
					continue
				}

				changed = true
				factorized = true

				const newNT = findFreeName(nt + '\'', nonterminals)
				nonterminals.push(newNT)

				rules = rules.filter(
					r => !(r.left === nt && r.right.length > 0 && r.right[0] === firstSym),
				)

				rules.push({
					left: nt,
					right: [...lcp, newNT],
				})

				for (const alt of alts) {
					rules.push({
						left: newNT,
						right: alt.slice(lcp.length),
					})
				}
			}
		}
	}

	return {
		grammar: {
			nonterminals,
			terminals: recomputeTerminals(rules, nonterminals),
			rules,
			startSymbol: grammar.startSymbol,
		},
		factorized,
	}
}

interface PreprocessResult {
	grammar: Grammar,
	addedAxiom: boolean,
	addedAxiomName: string,
	eliminatedLeftRecursion: boolean,
	factorized: boolean,
}

function preprocessGrammar(grammar: Grammar): PreprocessResult {
	const {grammar: noLR, eliminated: eliminatedLeftRecursion} = eliminateDirectLeftRecursion(grammar)

	const {grammar: factored, factorized} = leftFactor(noLR)

	const {grammar: result, added: addedAxiom} = addNewAxiom(factored)
	const addedAxiomName = addedAxiom
		? result.startSymbol
		: ''

	return {
		grammar: result,
		addedAxiom,
		addedAxiomName,
		eliminatedLeftRecursion,
		factorized,
	}
}

export {preprocessGrammar}
