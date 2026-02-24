import {type Grammar, type GrammarRule} from './types'

function parseLeft(leftRaw: string): string {
	const t = leftRaw.trim()
	if (t.startsWith('<') && t.endsWith('>')) {
		return t.slice(1, -1)
	}
	return t
}

function tokenizeAlternative(alt: string): string[] {
	const s = alt.trim()
	const tokens: string[] = []
	let i = 0
	while (i < s.length) {
		while (i < s.length && /\s/.test(s[i])) {
			i++
		}
		if (i >= s.length) break
		if (s[i] === '<') {
			const end = s.indexOf('>', i)
			if (end === -1) {
				throw new Error(`Не закрыта угловая скобка в: ${s}`)
			}
			tokens.push(s.slice(i + 1, end))
			i = end + 1
		}
		else {
			tokens.push(s[i])
			i++
		}
	}
	return tokens
}

function parseGrammar(grammarText: string): Grammar {
	const lines = grammarText
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0)

	const rules: GrammarRule[] = []
	const allSymbols = new Set<string>()
	const leftSides = new Set<string>()

	for (const line of lines) {
		if (line.includes('->')) {
			const idx = line.indexOf('->')
			const leftRaw = line.slice(0, idx).trim()
			const rightPart = line.slice(idx + 2).trim()
			const left = parseLeft(leftRaw)
			leftSides.add(left)
			const alternatives = rightPart.split('|').map(s => s.trim())

			for (const alternative of alternatives) {
				if (alternative === 'e' || alternative === '') {
					rules.push({
						left,
						right: [],
					})
				}
				else {
					const symbols = tokenizeAlternative(alternative)
					rules.push({
						left,
						right: symbols,
					})
					allSymbols.add(left)
					symbols.forEach(sym => allSymbols.add(sym))
				}
			}
		}
	}

	if (rules.length === 0) {
		throw new Error('Не найдены правила')
	}

	const nonterminals: string[] = []
	const terminals: string[] = []
	for (const symbol of allSymbols) {
		if (leftSides.has(symbol)) {
			nonterminals.push(symbol)
		}
		else {
			terminals.push(symbol)
		}
	}

	const startSymbol = rules[0].left

	if (terminals.length === 0) {
		throw new Error('Не найдены терминальные символы')
	}

	return {
		nonterminals,
		terminals,
		rules,
		startSymbol,
	}
}

export {
	parseGrammar,
}
