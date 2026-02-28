import {type Grammar, type GrammarRule} from '../types'
import {eliminateEpsilonRules} from './epsilon'

function buildDerivedByMap(grammar: Grammar): Map<string, Set<string>> {
	const derivedBy = new Map<string, Set<string>>()
	for (const nt of grammar.nonterminals) {
		derivedBy.set(nt, new Set([nt]))
	}

	let changed = true
	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (rule.right.length !== 1 || !grammar.nonterminals.includes(rule.right[0])) {
				continue
			}
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

	return derivedBy
}

function eliminateUnitRules(grammar: Grammar): Grammar {
	const derivedBy = buildDerivedByMap(grammar)

	const newRules: GrammarRule[] = []
	for (const rule of grammar.rules) {
		if (rule.right.length === 1 && grammar.nonterminals.includes(rule.right[0])) {
			continue
		}
		for (const b of derivedBy.get(rule.left)!) {
			newRules.push({
				left: b,
				right: rule.right,
			})
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

	for (const rule of grammar.rules) {
		if (rule.right.length === 0) {
			productive.add(rule.left)
		}
	}

	let changed = true
	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (rule.right.length === 0 || productive.has(rule.left)) {
				continue
			}
			const allProd = rule.right.every(
				s => grammar.terminals.includes(s) || productive.has(s),
			)
			if (allProd) {
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

function collectUsedTerminals(grammar: Grammar, rules: GrammarRule[]): string[] {
	const used = new Set<string>()
	for (const rule of rules) {
		for (const s of rule.right) {
			if (grammar.terminals.includes(s)) {
				used.add(s)
			}
		}
	}
	return grammar.terminals.filter(t => used.has(t))
}

function eliminateUnreachableSymbols(grammar: Grammar): Grammar {
	const reachable = getReachable(grammar)
	const rules = grammar.rules.filter(
		r => reachable.has(r.left) && r.right.every(
			s => grammar.terminals.includes(s) || reachable.has(s),
		),
	)
	return {
		nonterminals: grammar.nonterminals.filter(nt => reachable.has(nt)),
		terminals: collectUsedTerminals(grammar, rules),
		rules,
		startSymbol: grammar.startSymbol,
	}
}

function eliminateUselessSymbols(grammar: Grammar): Grammar {
	const productive = getProductive(grammar)

	const usefulRules = grammar.rules.filter(
		rule => rule.right.length > 0
			&& productive.has(rule.left)
			&& rule.right.every(s => grammar.terminals.includes(s) || productive.has(s)),
	)

	const reachable = getReachable({
		...grammar,
		rules: usefulRules,
	})

	const rules = usefulRules.filter(
		r => reachable.has(r.left) && r.right.every(
			s => grammar.terminals.includes(s) || reachable.has(s),
		),
	)

	return {
		nonterminals: grammar.nonterminals.filter(nt => reachable.has(nt) && productive.has(nt)),
		terminals: collectUsedTerminals(grammar, rules),
		rules,
		startSymbol: grammar.startSymbol,
	}
}

function toBinaryRules(grammar: Grammar): Grammar {
	const rules: GrammarRule[] = []
	const nonterminals = [...grammar.nonterminals]
	const terminals = [...grammar.terminals]
	let nextId = 0

	function ensureTerminalProxy(t: string): string {
		const name = `_T${t}`
		if (!nonterminals.includes(name)) {
			nonterminals.push(name)
			rules.push({
				left: name,
				right: [t],
			})
		}
		return name
	}

	function freshNt(): string {
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
		const right = rule.right.map(
			s => grammar.terminals.includes(s)
				? ensureTerminalProxy(s)
				: s,
		)
		let left = rule.left
		for (let i = 0; i < right.length - 2; i++) {
			const newNt = freshNt()
			rules.push({
				left,
				right: [right[i], newNt],
			})
			left = newNt
		}
		rules.push({
			left,
			right: [right[right.length - 2], right[right.length - 1]],
		})
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
	g = {
		...g,
		rules: g.rules.filter(r => r.right.length > 0),
	}
	g = eliminateUnitRules(g)
	g = eliminateUselessSymbols(g)
	g = toBinaryRules(g)
	return g
}

export {
	eliminateUnreachableSymbols,
	eliminateUnitRules,
	eliminateUselessSymbols,
	getProductive,
	getReachable,
	toChomskyNormalForm,
}
