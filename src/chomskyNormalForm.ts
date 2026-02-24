import {type Grammar, type GrammarRule} from './types'
import {eliminateEpsilonRules} from './epsilonElimination'

function eliminateUnitRules(grammar: Grammar): Grammar {
	const derivedBy = new Map<string, Set<string>>()
	for (const nt of grammar.nonterminals) {
		derivedBy.set(nt, new Set([nt]))
	}

	let changed = true
	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (rule.right.length === 1 && grammar.nonterminals.includes(rule.right[0])) {
				const a = rule.left
				const b = rule.right[0]
				const setB = derivedBy.get(b)!
				for (const c of derivedBy.get(a)!) {
					if (!setB.has(c)) {
						setB.add(c)
						changed = true
					}
				}
			}
		}
	}

	const newRules: GrammarRule[] = []
	for (const rule of grammar.rules) {
		if (rule.right.length === 1 && grammar.nonterminals.includes(rule.right[0])) {
			continue
		}
		for (const b of derivedBy.get(rule.left)!) {
			newRules.push({left: b, right: rule.right})
		}
	}

	return {
		nonterminals: grammar.nonterminals,
		terminals: grammar.terminals,
		rules: newRules,
		startSymbol: grammar.startSymbol,
	}
}

function getProductive(grammar: Grammar): Set<string> {
	const productive = new Set<string>()
	let changed = true

	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (rule.right.length === 0) {
				continue
			}
			const allProd = rule.right.every(s =>
				grammar.terminals.includes(s) || productive.has(s),
			)
			if (allProd && !productive.has(rule.left)) {
				productive.add(rule.left)
				changed = true
			}
		}
	}

	return productive
}

function getReachable(grammar: Grammar): Set<string> {
	const reachable = new Set<string>([grammar.startSymbol])
	let changed = true

	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (!reachable.has(rule.left)) {
				continue
			}
			for (const s of rule.right) {
				if (grammar.nonterminals.includes(s) && !reachable.has(s)) {
					reachable.add(s)
					changed = true
				}
			}
		}
	}

	return reachable
}

function eliminateUselessSymbols(grammar: Grammar): Grammar {
	const productive = getProductive(grammar)
	const usefulRules = grammar.rules.filter(rule => {
		if (rule.right.length === 0) {
			return false
		}
		return rule.right.every(s =>
			grammar.terminals.includes(s) || productive.has(s),
		) && productive.has(rule.left)
	})

	const reachable = getReachable({
		...grammar,
		rules: usefulRules,
	})
	const usefulRules2 = usefulRules.filter(r =>
		reachable.has(r.left) && r.right.every(s =>
			grammar.terminals.includes(s) || reachable.has(s),
		),
	)

	const nonterminals = grammar.nonterminals.filter(nt => reachable.has(nt) && productive.has(nt))
	const usedTerminals = new Set<string>()
	for (const rule of usefulRules2) {
		for (const s of rule.right) {
			if (grammar.terminals.includes(s)) {
				usedTerminals.add(s)
			}
		}
	}
	const terminals = grammar.terminals.filter(t => usedTerminals.has(t))

	return {
		nonterminals,
		terminals,
		rules: usefulRules2,
		startSymbol: grammar.startSymbol,
	}
}

function toBinaryRules(grammar: Grammar): Grammar {
	let rules: GrammarRule[] = []
	const nonterminals = [...grammar.nonterminals]
	const terminals = [...grammar.terminals]
	let nextId = 0

	function ensureTerminalNonterminal(t: string): string {
		const name = `_T${t}`
		if (!nonterminals.includes(name)) {
			nonterminals.push(name)
			rules.push({left: name, right: [t]})
		}
		return name
	}

	function freshNonterminal(): string {
		let name: string
		do {
			name = `_N${nextId++}`
		} while (nonterminals.includes(name))
		nonterminals.push(name)
		return name
	}

	for (const rule of grammar.rules) {
		if (rule.right.length === 0) {
			continue
		}
		if (rule.right.length === 1) {
			rules.push(rule)
			continue
		}
		const right = rule.right.map(s =>
			grammar.terminals.includes(s) ? ensureTerminalNonterminal(s) : s,
		)
		let left = rule.left
		for (let i = 0; i < right.length - 2; i++) {
			const newNt = freshNonterminal()
			rules.push({left, right: [right[i], newNt]})
			left = newNt
		}
		rules.push({left, right: [right[right.length - 2], right[right.length - 1]]})
	}

	return {
		nonterminals,
		terminals,
		rules,
		startSymbol: grammar.startSymbol,
	}
}

function toChomskyNormalForm(grammar: Grammar): Grammar {
	let g = eliminateEpsilonRules(grammar)
	g = {...g, rules: g.rules.filter(r => r.right.length > 0)}
	g = eliminateUnitRules(g)
	g = eliminateUselessSymbols(g)
	g = toBinaryRules(g)

	return g
}

export {
	toChomskyNormalForm,
	eliminateUnitRules,
	eliminateUselessSymbols,
	getProductive,
	getReachable,
}
