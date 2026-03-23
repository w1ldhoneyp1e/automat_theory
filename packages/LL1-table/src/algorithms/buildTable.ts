import {type Grammar, type LL1Row} from '../types'
import {computeFirst, getFirstOfSequence} from './first'
import {computeFollow} from './follow'

function buildLL1Table(grammar: Grammar): LL1Row[] {
	const first = computeFirst(grammar)
	const follow = computeFollow(grammar, first)
	const rows: LL1Row[] = []
	const ntFirstRow = new Map<string, number>()

	function getDirectingSet(right: string[], nt: string): string[] {
		const firstSet = getFirstOfSequence(right, first)
		const result = new Set<string>()

		for (const t of firstSet) {
			if (t !== 'e') {
				result.add(t)
			}
		}

		if (firstSet.has('e')) {
			for (const t of follow.get(nt) ?? []) {
				result.add(t)
			}
		}

		return [...result]
	}

	function processNT(nt: string): number {
		if (ntFirstRow.has(nt)) {
			return ntFirstRow.get(nt)!
		}

		const rules = grammar.rules.filter(r => r.left === nt)
		if (rules.length === 0) {
			return -1
		}

		const dispatchStart = rows.length
		ntFirstRow.set(nt, dispatchStart + 1)

		for (let i = 0; i < rules.length; i++) {
			const nm = getDirectingSet(rules[i].right, nt)
			rows.push({
				id: rows.length + 1,
				symbol: nt,
				nm,
				error: i === rules.length - 1,
				transition: null,
				shift: false,
				stack: false,
			})
		}

		for (let i = 0; i < rules.length; i++) {
			const right = rules[i].right

			if (right.length === 0) {
				rows[dispatchStart + i].transition = null
				continue
			}

			const bodyStart = rows.length + 1
			rows[dispatchStart + i].transition = bodyStart

			const pendingNTs: {
				rowIdx: number,
				nt: string,
			}[] = []

			for (let j = 0; j < right.length; j++) {
				const sym = right[j]
				const isLast = j === right.length - 1
				const isTerminal = !grammar.nonterminals.includes(sym)
				const currentIdx = rows.length

				let nm: string[]
				if (isTerminal) {
					nm = [sym]
				}
				else {
					const firstSym = first.get(sym) ?? new Set<string>()
					nm = [...firstSym].filter(s => s !== 'e')
					if (firstSym.has('e')) {
						for (const t of follow.get(sym) ?? []) {
							if (!nm.includes(t)) {
								nm.push(t)
							}
						}
					}
				}

				const transition: number | null = isTerminal
					? isLast
						? null
						: currentIdx + 2
					: null

				rows.push({
					id: rows.length + 1,
					symbol: sym,
					nm,
					error: true,
					transition,
					shift: isTerminal,
					stack: !isTerminal && !isLast,
				})

				if (!isTerminal) {
					pendingNTs.push({
						rowIdx: currentIdx,
						nt: sym,
					})
				}
			}

			for (const {rowIdx, nt: sym} of pendingNTs) {
				const ntDispatch = processNT(sym)
				rows[rowIdx].transition = ntDispatch
			}
		}

		return dispatchStart + 1
	}

	processNT(grammar.startSymbol)

	return rows
}

export {buildLL1Table}
