import {type Grammar} from '../types'

function computeFollow(
	grammar: Grammar,
	first: Map<string, Set<string>>,
): Map<string, Set<string>> {
	const follow = new Map<string, Set<string>>()

	for (const nt of grammar.nonterminals) {
		follow.set(nt, new Set())
	}

	follow.get(grammar.startSymbol)!.add('$')

	let changed = true
	while (changed) {
		changed = false

		for (const {left, right} of grammar.rules) {
			for (let i = 0; i < right.length; i++) {
				const sym = right[i]
				if (!grammar.nonterminals.includes(sym)) {
					continue
				}

				const followSym = follow.get(sym)!
				const rest = right.slice(i + 1)

				let restNullable = true
				for (const restSym of rest) {
					const firstRest = first.get(restSym) ?? new Set([restSym])
					for (const t of firstRest) {
						if (t !== 'ε' && !followSym.has(t)) {
							followSym.add(t)
							changed = true
						}
					}
					if (!firstRest.has('ε')) {
						restNullable = false
						break
					}
				}

				if (restNullable) {
					for (const t of follow.get(left)!) {
						if (!followSym.has(t)) {
							followSym.add(t)
							changed = true
						}
					}
				}
			}
		}
	}

	return follow
}

export {computeFollow}
