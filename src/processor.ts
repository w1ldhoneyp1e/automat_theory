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
import {eliminateEpsilonRules, getNullable} from './grammar/epsilon'
import {
	eliminateUnitRules,
	eliminateUnreachableSymbols,
	getProductive,
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

function stripLeadingUnderscore(name: string): string {
	return name.startsWith('_')
		? name.slice(1)
		: name
}

function centerStr(s: string, width: number): string {
	const pad = Math.max(0, width - s.length)
	return ' '.repeat(Math.floor(pad / 2)) + s + ' '.repeat(Math.ceil(pad / 2))
}

function formatCykTable(tokens: string[], table: string[][][], startSymbol: string): string {
	const n = tokens.length

	const displayNt = (nt: string) => stripLeadingUnderscore(nt)

	const getCell = (i: number, len: number): string => {
		if (i + len > n) {
			return ''
		}
		const nts = table[i][len - 1].map(displayNt)
		return nts.length > 0
			? nts.join(',')
			: '—'
	}

	let maxW = 1
	for (let i = 0; i < n; i++) {
		for (let len = 1; len <= n - i; len++) {
			const c = getCell(i, len)
			if (c && c !== '—') {
				maxW = Math.max(maxW, c.length)
			}
		}
		maxW = Math.max(maxW, tokens[i].length)
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
			if (cell === '') {
				row += ' '.repeat(cellW) + '│'
			}
			else {
				const isTop = len === n && i === 0 && cell !== '—' && cell.split(',').includes(stripLeadingUnderscore(startSymbol))
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

	let tokenRow = ' '.repeat(lW)
	for (let i = 0; i < n; i++) {
		tokenRow += ' ' + centerStr(tokens[i], cellW)
	}
	lines.push(tokenRow)

	return lines.join('\n')
}

function grammarToText(grammar: Grammar): string {
	function fmtNt(s: string): string {
		const d = stripLeadingUnderscore(s)
		return d.length === 1
			? d
			: `<${d}>`
	}

	function fmtSym(s: string): string {
		if (grammar.nonterminals.includes(s)) {
			return fmtNt(s)
		}
		return s.length === 1
			? s
			: `"${s}"`
	}

	const byLeft = new Map<string, string[][]>()
	for (const r of grammar.rules) {
		if (!byLeft.has(r.left)) {
			byLeft.set(r.left, [])
		}
		byLeft.get(r.left)!.push(r.right.length === 0
			? []
			: r.right.map(fmtSym))
	}

	return grammar.nonterminals
		.filter(left => byLeft.has(left) && byLeft.get(left)!.length > 0)
		.map(left => {
			const alts = byLeft.get(left)!
				.map(r => r.length === 0
					? 'e'
					: r.join(' '))
				.join(' | ')
			return `${fmtNt(left)} -> ${alts}`
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

function reduceRemoveNonProductive(grammar: Grammar): Grammar {
	const productive = getProductive(grammar)
	const rules = grammar.rules.filter(
		r => productive.has(r.left)
			&& r.right.every(s => grammar.terminals.includes(s) || productive.has(s)),
	)
	const usedTerminals = new Set<string>()
	for (const rule of rules) {
		for (const s of rule.right) {
			if (grammar.terminals.includes(s)) {
				usedTerminals.add(s)
			}
		}
	}
	return {
		nonterminals: grammar.nonterminals.filter(nt => productive.has(nt)),
		terminals: grammar.terminals.filter(t => usedTerminals.has(t)),
		rules,
		startSymbol: grammar.startSymbol,
	}
}

function reduceRemoveUnreachable(grammar: Grammar): Grammar {
	const reachable = getReachable(grammar)
	const rules = grammar.rules.filter(
		r => reachable.has(r.left) && r.right.every(
			s => grammar.terminals.includes(s) || reachable.has(s),
		),
	)
	const usedTerminals = new Set<string>()
	for (const rule of rules) {
		for (const s of rule.right) {
			if (grammar.terminals.includes(s)) {
				usedTerminals.add(s)
			}
		}
	}
	return {
		nonterminals: grammar.nonterminals.filter(nt => reachable.has(nt)),
		terminals: grammar.terminals.filter(t => usedTerminals.has(t)),
		rules,
		startSymbol: grammar.startSymbol,
	}
}

function processGrammarReduce(grammarText: string): string {
	const g0 = parseGrammar(grammarText)
	const lines: string[] = []

	lines.push('Исходная грамматика:')
	lines.push(grammarToText(g0))
	lines.push('')

	const productive0 = getProductive(g0)
	const nonProductive0 = g0.nonterminals.filter(nt => !productive0.has(nt))
	const g1 = reduceRemoveNonProductive(g0)

	if (nonProductive0.length > 0) {
		lines.push(`Шаг 1. Удалены непродуктивные: ${nonProductive0.join(', ')}`)
	}
	else {
		lines.push('Шаг 1. Непродуктивных символов нет')
	}

	const reachable1 = getReachable(g1)
	const unreachable1 = g1.nonterminals.filter(nt => !reachable1.has(nt))
	const g2 = reduceRemoveUnreachable(g1)

	if (unreachable1.length > 0) {
		lines.push(`Шаг 2. Удалены недостижимые: ${unreachable1.join(', ')}`)
	}
	else {
		lines.push('Шаг 2. Недостижимых символов нет')
	}

	const nullable = getNullable(g2)
	const epsilonNts = g2.nonterminals.filter(nt => nullable.has(nt))
	const g3 = eliminateEpsilonRules(g2)
	const g3NoEps = {
		...g3,
		rules: g3.rules.filter(r => r.right.length > 0),
	}

	if (epsilonNts.length > 0) {
		const acceptsEmpty = nullable.has(g2.startSymbol)
		lines.push(`Шаг 3. Устранены пустые правила (nullable: ${epsilonNts.join(', ')})${acceptsEmpty
			? '; язык содержит ε, введён новый старт'
			: ''}`)
	}
	else {
		lines.push('Шаг 3. Пустых правил нет')
	}

	const unitRules = g3NoEps.rules.filter(
		r => r.right.length === 1 && g3NoEps.nonterminals.includes(r.right[0]),
	)
	const g4 = eliminateUnitRules(g3NoEps)

	if (unitRules.length > 0) {
		const pairs = unitRules.map(r => `${r.left}→${r.right[0]}`).join(', ')
		lines.push(`Шаг 4. Устранены циклы (цепные правила): ${pairs}`)
	}
	else {
		lines.push('Шаг 4. Циклов (цепных правил) нет')
	}

	const productive4 = getProductive(g4)
	const nonProductive4 = g4.nonterminals.filter(nt => !productive4.has(nt))
	const g5 = reduceRemoveNonProductive(g4)

	if (nonProductive4.length > 0) {
		lines.push(`Шаг 5. Удалены непродуктивные: ${nonProductive4.join(', ')}`)
	}
	else {
		lines.push('Шаг 5. Непродуктивных символов нет')
	}

	const reachable5 = getReachable(g5)
	const unreachable5 = g5.nonterminals.filter(nt => !reachable5.has(nt))
	const g6 = reduceRemoveUnreachable(g5)

	if (unreachable5.length > 0) {
		lines.push(`Шаг 6. Удалены недостижимые: ${unreachable5.join(', ')}`)
	}
	else {
		lines.push('Шаг 6. Недостижимых символов нет')
	}

	lines.push('')
	lines.push('Результат:')
	lines.push(grammarToText(g6))

	return lines.join('\n')
}

function processGrammarCYK(grammarText: string, word: string): string {
	const grammar = parseGrammar(grammarText)
	const cnf = toChomskyNormalForm(grammar)
	const result = cyk(cnf, word)
	const belongsStr = result.belongs
		? 'да'
		: 'нет'
	const tokensStr = result.tokens.join(' ')
	const cnfText = grammarToText(cnf)
	const tableStr = result.table.length > 0
		? `\nТаблица CYK:\n${formatCykTable(result.tokens, result.table, cnf.startSymbol)}`
		: ''

	return [
		`Грамматика в КНФ (${cnf.rules.length} правил):`,
		cnfText,
		'',
		`Токены: [${tokensStr}]`,
		`Принадлежность: ${belongsStr}`,
		tableStr,
	].join('\n')
}

export {
	parse,
	detectMachineType,
	processAsIs,
	processConversion,
	processDeterminization,
	processGrammarCYK,
	processGrammarNormalize,
	processGrammarReduce,
	processGrammarToDFA,
	processMinimization,
	processRegexToNFA,
}
