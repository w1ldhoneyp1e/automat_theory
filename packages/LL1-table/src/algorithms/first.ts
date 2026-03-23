import {type Grammar} from '../types'

function computeFirst(grammar: Grammar): Map<string, Set<string>> {
	const first = new Map<string, Set<string>>()

	for (const t of grammar.terminals) {
		first.set(t, new Set([t]))
	}

	for (const nt of grammar.nonterminals) {
		first.set(nt, new Set())
	}

	let changed = true
	while (changed) {
		changed = false

		for (const {left, right} of grammar.rules) {
			const firstLeft = first.get(left)!

			if (right.length === 0) {
				if (!firstLeft.has('ε')) {
					firstLeft.add('ε')
					changed = true
				}
				continue
			}

			let allNullable = true
			for (const sym of right) {
				const firstSym = first.get(sym) ?? new Set([sym])
				for (const t of firstSym) {
					if (t !== 'ε' && !firstLeft.has(t)) {
						firstLeft.add(t)
						changed = true
					}
				}
				if (!firstSym.has('ε')) {
					allNullable = false
					break
				}
			}

			if (allNullable && !firstLeft.has('ε')) {
				firstLeft.add('ε')
				changed = true
			}
		}
	}

	return first
}

function getFirstOfSequence(
	sequence: string[],
	first: Map<string, Set<string>>,
): Set<string> {
	if (sequence.length === 0) {
		return new Set(['ε'])
	}

	const result = new Set<string>()
	let allNullable = true

	for (const sym of sequence) {
		const firstSym = first.get(sym) ?? new Set([sym])
		for (const t of firstSym) {
			if (t !== 'ε') {
				result.add(t)
			}
		}
		if (!firstSym.has('ε')) {
			allNullable = false
			break
		}
	}

	if (allNullable) {
		result.add('ε')
	}

	return result
}

export {computeFirst, getFirstOfSequence}
