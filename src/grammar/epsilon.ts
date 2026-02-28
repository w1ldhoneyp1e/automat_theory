import {type Grammar, type GrammarRule} from '../types'

function getNullable(grammar: Grammar): Set<string> {
	const nullable = new Set<string>()
	let changed = true

	while (changed) {
		changed = false
		for (const rule of grammar.rules) {
			if (nullable.has(rule.left)) {
				continue
			}
			if (rule.right.length === 0) {
				nullable.add(rule.left)
				changed = true
				continue
			}
			const allNullable = rule.right.every(
				s => grammar.nonterminals.includes(s) && nullable.has(s),
			)
			if (allNullable) {
				nullable.add(rule.left)
				changed = true
			}
		}
	}

	return nullable
}

function enumerateSubsets(indices: number[]): Set<number>[] {
	const result: Set<number>[] = []

	function go(idx: number, chosen: Set<number>): void {
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

function expandRightSides(grammar: Grammar, nullable: Set<string>): GrammarRule[] {
	const newRules: GrammarRule[] = []

	for (const rule of grammar.rules) {
		if (rule.right.length === 0) {
			continue
		}

		const nullableIndices: number[] = rule.right.reduce<number[]>((acc, s, i) => {
			if (grammar.nonterminals.includes(s) && nullable.has(s)) {
				acc.push(i)
			}
			return acc
		}, [])

		const seen = new Set<string>()
		for (const toDrop of enumerateSubsets(nullableIndices)) {
			const right = rule.right.filter((_, i) => !toDrop.has(i))
			if (right.length === 0) {
				continue
			}
			const key = `${rule.left}\t${right.join(',')}`
			if (!seen.has(key)) {
				seen.add(key)
				newRules.push({
					left: rule.left,
					right,
				})
			}
		}
	}

	return newRules
}

function eliminateEpsilonRules(grammar: Grammar): Grammar {
	const nullable = getNullable(grammar)
	const newRules = expandRightSides(grammar, nullable)

	if (!nullable.has(grammar.startSymbol)) {
		return {
			nonterminals: grammar.nonterminals,
			terminals: grammar.terminals,
			rules: newRules,
			startSymbol: grammar.startSymbol,
		}
	}

	const newStart = `${grammar.startSymbol}'`
	return {
		nonterminals: [newStart, ...grammar.nonterminals],
		terminals: grammar.terminals,
		rules: [
			{
				left: newStart,
				right: [grammar.startSymbol],
			},
			{
				left: newStart,
				right: [],
			},
			...newRules,
		],
		startSymbol: newStart,
	}
}

export {
	eliminateEpsilonRules,
	getNullable,
}
