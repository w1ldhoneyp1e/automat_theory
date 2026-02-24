import {type Grammar, type GrammarRule} from './types'

function getNullable(grammar: Grammar): Set<string> {
	const nullable = new Set<string>()
	let changed = true

	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (rule.right.length === 0) {
				if (!nullable.has(rule.left)) {
					nullable.add(rule.left)
					changed = true
				}
				continue
			}
			const allNullable = rule.right.every(s => grammar.nonterminals.includes(s) && nullable.has(s))
			if (allNullable && !nullable.has(rule.left)) {
				nullable.add(rule.left)
				changed = true
			}
		}
	}

	return nullable
}

function expandRightSides(grammar: Grammar, nullable: Set<string>): GrammarRule[] {
	const newRules: GrammarRule[] = []

	for (const rule of grammar.rules) {
		if (rule.right.length === 0) {
			continue
		}

		const nullableIndices: number[] = []
		for (let i = 0; i < rule.right.length; i++) {
			const s = rule.right[i]
			if (grammar.nonterminals.includes(s) && nullable.has(s)) {
				nullableIndices.push(i)
			}
		}

		const dropSets = enumerateSubsets(nullableIndices)
		const seen = new Set<string>()
		for (const toDrop of dropSets) {
			const right: string[] = []
			for (let i = 0; i < rule.right.length; i++) {
				if (!toDrop.has(i)) {
					right.push(rule.right[i])
				}
			}
			if (right.length > 0) {
				const key = `${rule.left}\t${right.join(',')}`
				if (!seen.has(key)) {
					seen.add(key)
					newRules.push({left: rule.left, right})
				}
			}
		}
	}

	return newRules
}

function enumerateSubsets(indices: number[]): Set<number>[] {
	const result: Set<number>[] = []

	function go(idx: number, chosen: Set<number>) {
		if (idx === indices.length) {
			result.push(new Set(chosen))
			return
		}
		go(idx + 1, chosen)
		const next = new Set(chosen)
		next.add(indices[idx])
		go(idx + 1, next)
	}

	go(0, new Set())
	return result
}

function eliminateEpsilonRules(grammar: Grammar): Grammar {
	const nullable = getNullable(grammar)
	const newRules = expandRightSides(grammar, nullable)

	let startSymbol = grammar.startSymbol
	let nonterminals = [...grammar.nonterminals]
	let rules = newRules

	if (nullable.has(grammar.startSymbol)) {
		const newStart = 'S\''
		nonterminals = [newStart, ...grammar.nonterminals]
		rules = [
			{left: newStart, right: [grammar.startSymbol]},
			{left: newStart, right: []},
			...rules,
		]
		startSymbol = newStart
	}

	return {
		nonterminals,
		terminals: grammar.terminals,
		rules,
		startSymbol,
	}
}

export {
	eliminateEpsilonRules,
	getNullable,
}
