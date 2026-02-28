import {
	eliminateUnreachableSymbols,
	getReachable,
	toChomskyNormalForm,
} from './chomskyNormalForm'
import {mealyToMoore, mooreToMealy} from './converter'
import {cyk} from './cyk'
import {
	determinizeMealy,
	determinizeNFA,
	dfaToDot,
	isMealyDeterministic,
} from './determinizer'
import {minimizeDFA} from './dfaMinimizer'
import {generateMealyDot, generateMooreDot} from './generator'
import {parseGrammar} from './grammarParser'
import {dfaToDot as grammarDfaToDot, grammarToDFA} from './grammarToDfa'
import {minimizeMealy} from './minimizer/mealy'
import {minimizeMoore} from './minimizer/moore'
import {nfaToDot, regexToNFA} from './regexToNfa'
import {
	type DotGraph,
	type Grammar,
	type MealyMachine,
	type MooreMachine,
} from './types'

function processAsIs(inputContent: string): string {
	return inputContent
}

function processMealyConversion(dotGraph: DotGraph): string {
	const mooreMachine = mealyToMoore(dotGraph)
	return generateMooreDot(mooreMachine)
}

function processMooreConversion(dotGraph: DotGraph): string {
	const mealyMachine = mooreToMealy(dotGraph)
	return generateMealyDot(mealyMachine)
}

function processConversion(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		return processMealyConversion(dotGraph)
	}

	return processMooreConversion(dotGraph)
}

function parseMealyFromDot(dotGraph: DotGraph): MealyMachine {
	const states = dotGraph.nodes.map(node => node.id)
	const transitions = dotGraph.edges
		.filter(edge => edge.label && edge.label.includes('/'))
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
	const states = dotGraph.nodes
		.map(node => {
			if (node.label && node.label.includes('/')) {
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
		input: edge.label || '',
	}))

	return {
		states,
		transitions,
	}
}

function processMealyMinimization(dotGraph: DotGraph): string {
	const mealyMachine = parseMealyFromDot(dotGraph)
	const minimizedMachine = minimizeMealy(mealyMachine)
	return generateMealyDot(minimizedMachine)
}

function processMooreMinimization(dotGraph: DotGraph): string {
	const mooreMachine = parseMooreFromDot(dotGraph)
	const minimizedMachine = minimizeMoore(mooreMachine)
	return generateMooreDot(minimizedMachine)
}

function processMinimization(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		return processMealyMinimization(dotGraph)
	}
	return processMooreMinimization(dotGraph)
}

function processMealyDeterminization(dotGraph: DotGraph): string {
	const mealyMachine = parseMealyFromDot(dotGraph)
	const determinizedMachine = determinizeMealy(mealyMachine)

	if (isMealyDeterministic(mealyMachine)) {
		console.log('Автомат уже является детерминированным')
	}

	return generateMealyDot(determinizedMachine)
}

function processDeterminization(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		return processMealyDeterminization(dotGraph)
	}

	const mealyMachine = mooreToMealy(dotGraph)

	if (isMealyDeterministic(mealyMachine)) {
		console.log('Автомат уже является детерминированным')
		return generateMealyDot(mealyMachine)
	}

	const determinizedMealy = determinizeMealy(mealyMachine)
	return generateMealyDot(determinizedMealy)
}

function processGrammarToDFA(grammarText: string): string {
	const grammar = parseGrammar(grammarText)
	const dfa = grammarToDFA(grammar)
	return grammarDfaToDot(dfa)
}

function processRegexToNFA(regexText: string, shouldMinimize: boolean = false): string {
	const regex = regexText.trim()
	const nfa = regexToNFA(regex)

	if (shouldMinimize) {
		const dfa = determinizeNFA(nfa)
		const minimizedDfa = minimizeDFA(dfa)
		return dfaToDot(minimizedDfa)
	}

	return nfaToDot(nfa)
}

function isInternalNonterminal(nt: string): boolean {
	return nt.startsWith('_T') || nt.startsWith('_N')
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

	const center = (s: string, width: number): string => {
		const pad = Math.max(0, width - s.length)
		return ' '.repeat(Math.floor(pad / 2)) + s + ' '.repeat(Math.ceil(pad / 2))
	}

	const makeSep = (type: 'top' | 'mid' | 'bot'): string => {
		let l: string, m: string, r: string
		if (type === 'top') {
			l = '┌'; m = '┬'; r = '┐'
		}
		else if (type === 'bot') {
			l = '└'; m = '┴'; r = '┘'
		}
		else {
			l = '├'; m = '┼'; r = '┤'
		}
		return ' '.repeat(lW) + l + Array(n).fill('─'.repeat(cellW))
			.join(m) + r
	}

	const lines: string[] = []
	lines.push(makeSep('top'))

	for (let len = n; len >= 1; len--) {
		let row = center(String(len), lW - 1) + ' │'
		for (let i = 0; i < n; i++) {
			const cell = getCell(i, len)
			if (cell === null) {
				row += ' '.repeat(cellW) + '│'
			}
			else {
				const isTop = len === n && i === 0 && cell !== '—' && cell.split(',').includes(startSymbol)
				row += center(isTop
					? cell + ' ✓'
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
		charRow += ' ' + center(w[i], cellW)
	}
	lines.push(charRow)

	return lines.join('\n')
}

function grammarToText(grammar: Grammar): string {
	function fmtSym(s: string): string {
		if (grammar.nonterminals.includes(s)) {
			return s.length === 1 && s >= 'A' && s <= 'Z'
				? s
				: `<${s}>`
		}
		return s.length === 1
			? s
			: `<${s}>`
	}
	function fmtLeft(s: string): string {
		return s.length === 1 && s >= 'A' && s <= 'Z'
			? s
			: `<${s}>`
	}
	const byLeft = new Map<string, string[][]>()
	for (const r of grammar.rules) {
		const key = r.left
		if (!byLeft.has(key)) {
			byLeft.set(key, [])
		}
		byLeft.get(key)!.push(r.right.length === 0
			? []
			: r.right.map(fmtSym))
	}
	const lines: string[] = []
	for (const left of grammar.nonterminals) {
		const rights = byLeft.get(left)
		if (!rights || rights.length === 0) {
			continue
		}
		const alts = rights.map(r => r.length === 0
			? 'e'
			: r.join('')).join(' | ')
		lines.push(`${fmtLeft(left)} -> ${alts}`)
	}
	return lines.join('\n')
}

function processGrammarNormalize(grammarText: string, verbose: boolean = true): string {
	const grammar = parseGrammar(grammarText)
	const reachable = getReachable(grammar)
	const unreachable = grammar.nonterminals.filter(nt => !reachable.has(nt))
	const cleaned = eliminateUnreachableSymbols(grammar)
	const lines: string[] = []
	if (verbose && unreachable.length > 0) {
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
	processAsIs,
	processConversion,
	processDeterminization,
	processGrammarToDFA,
	processGrammarCYK,
	processGrammarNormalize,
	processMinimization,
	processRegexToNFA,
}
