import {mealyToMoore, mooreToMealy} from './automata/converter'
import {
	determinizeMealy,
	determinizeNFA,
	dfaToDot,
	isMealyDeterministic,
} from './automata/determinizer'
import {minimizeDFA} from './automata/dfa-minimizer'
import {generateMealyDot, generateMooreDot} from './automata/generator'
import {dfaToDot as grammarDfaToDot, grammarToDFA} from './automata/grammar-to-dfa'
import {minimizeMealy} from './automata/minimizer/mealy'
import {minimizeMoore} from './automata/minimizer/moore'
import {detectMachineType, parse} from './dot/parser'
import {cyk} from './grammar/cyk'
import {
	eliminateUnreachableSymbols,
	getReachable,
	toChomskyNormalForm,
} from './grammar/normalization'
import {parseGrammar} from './grammar/parser'
import {nfaToDot, regexToNFA} from './regex/to-nfa'
import {
	type DotGraph,
	type Grammar,
	type MealyMachine,
	type MooreMachine,
} from './types'

function processAsIs(inputContent: string): string {
	return inputContent
}

function parseMealyFromDot(dotGraph: DotGraph): MealyMachine {
	const states = dotGraph.nodes.map(node => node.id)
	const transitions = dotGraph.edges
		.filter(edge => edge.label?.includes('/'))
		.map(edge => {
			const [input, output] = edge.label!.split('/')
			return {
				from: edge.from,
				to: edge.to,
				input: input.trim(),
				output: output.trim(),
			}
		})
	return {
		states,
		transitions,
	}
}

function parseMooreFromDot(dotGraph: DotGraph): MooreMachine {
	const states = dotGraph.nodes.map(node => {
		if (node.label?.includes('/')) {
			const [stateName, output] = node.label.split('/')
			return {
				name: stateName.trim(),
				output: output.trim(),
			}
		}
		return {
			name: node.id,
			output: '',
		}
	})
	const transitions = dotGraph.edges.map(edge => ({
		from: edge.from,
		to: edge.to,
		input: edge.label ?? '',
	}))
	return {
		states,
		transitions,
	}
}

function processConversion(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		return generateMooreDot(mealyToMoore(dotGraph))
	}
	return generateMealyDot(mooreToMealy(dotGraph))
}

function processMinimization(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		return generateMealyDot(minimizeMealy(parseMealyFromDot(dotGraph)))
	}
	return generateMooreDot(minimizeMoore(parseMooreFromDot(dotGraph)))
}

function processDeterminization(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		const machine = parseMealyFromDot(dotGraph)
		if (isMealyDeterministic(machine)) {
			console.log('Автомат уже является детерминированным')
		}
		return generateMealyDot(determinizeMealy(machine))
	}

	const mealyMachine = mooreToMealy(dotGraph)
	if (isMealyDeterministic(mealyMachine)) {
		console.log('Автомат уже является детерминированным')
		return generateMealyDot(mealyMachine)
	}
	return generateMealyDot(determinizeMealy(mealyMachine))
}

function processGrammarToDFA(grammarText: string): string {
	return grammarDfaToDot(grammarToDFA(parseGrammar(grammarText)))
}

function processRegexToNFA(regexText: string, shouldMinimize: boolean = false): string {
	const nfa = regexToNFA(regexText.trim())
	if (shouldMinimize) {
		return dfaToDot(minimizeDFA(determinizeNFA(nfa)))
	}
	return nfaToDot(nfa)
}

function isInternalNonterminal(nt: string): boolean {
	return nt.startsWith('_T') || nt.startsWith('_N')
}

function centerStr(s: string, width: number): string {
	const pad = Math.max(0, width - s.length)
	return ' '.repeat(Math.floor(pad / 2)) + s + ' '.repeat(Math.ceil(pad / 2))
}

function formatCykTable(w: string, table: string[][][], startSymbol: string): string {
	const n = w.length

	const getCell = (i: number, len: number): string | null => {
		if (i + len > n) {
			return null
		}
		const nts = table[i][len - 1].filter(nt => !isInternalNonterminal(nt))
		return nts.length > 0
			? nts.join(',')
			: '—'
	}

	let maxW = 1
	for (let i = 0; i < n; i++) {
		for (let len = 1; len <= n - i; len++) {
			const c = getCell(i, len)
			if (c) {
				maxW = Math.max(maxW, c.length)
			}
		}
		maxW = Math.max(maxW, w[i].length)
	}
	const cellW = maxW + 4
	const lW = String(n).length + 1

	const makeSep = (type: 'top' | 'mid' | 'bot'): string => {
		const chars = {
			top: ['┌', '┬', '┐'],
			mid: ['├', '┼', '┤'],
			bot: ['└', '┴', '┘'],
		}
		const [l, m, r] = chars[type]
		const cells = Array(n).fill('─'.repeat(cellW))
			.join(m)
		return ' '.repeat(lW) + l + cells + r
	}

	const lines: string[] = [makeSep('top')]

	for (let len = n; len >= 1; len--) {
		let row = centerStr(String(len), lW - 1) + ' │'
		for (let i = 0; i < n; i++) {
			const cell = getCell(i, len)
			if (cell === null) {
				row += ' '.repeat(cellW) + '│'
			}
			else {
				const isTop = len === n && i === 0 && cell !== '—' && cell.split(',').includes(startSymbol)
				row += centerStr(isTop
					? `${cell} ✓`
					: cell, cellW) + '│'
			}
		}
		lines.push(row)
		if (len > 1) {
			lines.push(makeSep('mid'))
		}
	}

	lines.push(makeSep('bot'))

	let charRow = ' '.repeat(lW)
	for (let i = 0; i < n; i++) {
		charRow += ' ' + centerStr(w[i], cellW)
	}
	lines.push(charRow)

	return lines.join('\n')
}

function grammarToText(grammar: Grammar): string {
	function fmt(s: string): string {
		return s.length === 1
			? s
			: `<${s}>`
	}

	const byLeft = new Map<string, string[][]>()
	for (const r of grammar.rules) {
		if (!byLeft.has(r.left)) {
			byLeft.set(r.left, [])
		}
		byLeft.get(r.left)!.push(r.right.length === 0
			? []
			: r.right.map(fmt))
	}

	return grammar.nonterminals
		.filter(left => byLeft.has(left) && byLeft.get(left)!.length > 0)
		.map(left => {
			const alts = byLeft.get(left)!.map(r => r.length === 0
				? 'e'
				: r.join('')).join(' | ')
			return `${fmt(left)} -> ${alts}`
		})
		.join('\n')
}

function processGrammarNormalize(grammarText: string): string {
	const grammar = parseGrammar(grammarText)
	const reachable = getReachable(grammar)
	const unreachable = grammar.nonterminals.filter(nt => !reachable.has(nt))
	const cleaned = eliminateUnreachableSymbols(grammar)
	const lines: string[] = []
	if (unreachable.length > 0) {
		lines.push(`Удалены недостижимые: ${unreachable.join(', ')}`)
		lines.push('')
	}
	lines.push(grammarToText(cleaned))
	return lines.join('\n')
}

function processGrammarCYK(grammarText: string, word: string): string {
	const grammar = parseGrammar(grammarText)
	const cnf = toChomskyNormalForm(grammar)
	const result = cyk(cnf, word)
	const belongsStr = result.belongs
		? 'да'
		: 'нет'
	const tableStr = result.table.length > 0
		? `Таблица CYK:\n${formatCykTable(word, result.table, cnf.startSymbol)}`
		: ''
	return `Грамматика (КНФ): ${cnf.rules.length} правил\nСтрока: "${word}"\nПринадлежность: ${belongsStr}\n${tableStr}`
}

export {
	parse,
	detectMachineType,
	processAsIs,
	processConversion,
	processDeterminization,
	processGrammarCYK,
	processGrammarNormalize,
	processGrammarToDFA,
	processMinimization,
	processRegexToNFA,
}
