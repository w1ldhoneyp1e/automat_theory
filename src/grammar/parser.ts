import {type Grammar, type GrammarRule} from '../types'

function parseLeft(leftRaw: string): string {
	const t = leftRaw.trim()
	if (t.startsWith('<') && t.endsWith('>')) {
		return t.slice(1, -1)
	}
	return t
}

interface ParsedToken {
	text: string,
	isQuotedTerminal: boolean,
}

function tokenizeAlternative(alt: string): ParsedToken[] {
	const s = alt.trim()
	const tokens: ParsedToken[] = []
	let i = 0
	while (i < s.length) {
		while (i < s.length && /\s/.test(s[i])) {
			i++
		}
		if (i >= s.length) {
			break
		}
		if (s[i] === '"') {
			const end = s.indexOf('"', i + 1)
			if (end === -1) {
				throw new Error(`Не закрыта кавычка в: ${s}`)
			}
			tokens.push({
				text: s.slice(i + 1, end),
				isQuotedTerminal: true,
			})
			i = end + 1
		}
		else if (s[i] === '<') {
			const end = s.indexOf('>', i)
			if (end === -1) {
				throw new Error(`Не закрыта угловая скобка в: ${s}`)
			}
			tokens.push({
				text: s.slice(i + 1, end),
				isQuotedTerminal: false,
			})
			i = end + 1
		}
		else {
			tokens.push({
				text: s[i],
				isQuotedTerminal: false,
			})
			i++
		}
	}
	return tokens
}

interface ParseCollector {
	rules: GrammarRule[],
	unquotedSymbols: Set<string>,
	quotedTerminals: Set<string>,
}

function parseAlternative(left: string, alternative: string, col: ParseCollector): void {
	if (alternative === 'e' || alternative === '') {
		col.rules.push({
			left,
			right: [],
		})
		return
	}
	const parsed = tokenizeAlternative(alternative)
	col.rules.push({
		left,
		right: parsed.map(t => t.text),
	})
	col.unquotedSymbols.add(left)
	for (const t of parsed) {
		if (t.isQuotedTerminal) {
			col.quotedTerminals.add(t.text)
		}
		else {
			col.unquotedSymbols.add(t.text)
		}
	}
}

function parseGrammar(grammarText: string): Grammar {
	const lines = grammarText
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0)

	const col: ParseCollector = {
		rules: [],
		unquotedSymbols: new Set<string>(),
		quotedTerminals: new Set<string>(),
	}
	const leftSides = new Set<string>()

	for (const line of lines) {
		if (!line.includes('->')) {
			continue
		}
		const idx = line.indexOf('->')
		const left = parseLeft(line.slice(0, idx).trim())
		leftSides.add(left)
		const alternatives = line.slice(idx + 2).trim()
			.split('|')
			.map(s => s.trim())
		for (const alt of alternatives) {
			parseAlternative(left, alt, col)
		}
	}

	if (col.rules.length === 0) {
		throw new Error('Не найдены правила')
	}

	const nonterminals: string[] = []
	const terminals: string[] = []

	for (const symbol of col.unquotedSymbols) {
		if (leftSides.has(symbol)) {
			nonterminals.push(symbol)
		}
		else {
			terminals.push(symbol)
		}
	}

	for (const t of col.quotedTerminals) {
		if (!terminals.includes(t)) {
			terminals.push(t)
		}
	}

	if (terminals.length === 0) {
		throw new Error('Не найдены терминальные символы')
	}

	return {
		nonterminals,
		terminals,
		rules: col.rules,
		startSymbol: col.rules[0].left,
	}
}

export {
	parseGrammar,
}
