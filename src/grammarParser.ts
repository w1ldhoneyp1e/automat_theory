import {type Grammar, type GrammarRule} from './types'

function parseGrammar(grammarText: string): Grammar {
	const lines = grammarText
		.split('\n')
		.map(line => line.trim())
		.filter(line => line.length > 0)

	const rules: GrammarRule[] = []
	const allSymbols = new Set<string>()

	for (const line of lines) {
		if (line.includes('->')) {
			const [left, rightPart] = line.split('->').map(s => s.trim())
			const alternatives = rightPart.split('|').map(s => s.trim())

			for (const alternative of alternatives) {
				if (alternative === 'e') {
					rules.push({
						left,
						right: [],
					})
				}
				else {
					const symbols = alternative.split('').filter(s => s.trim().length > 0)
					rules.push({
						left,
						right: symbols,
					})

					allSymbols.add(left)
					symbols.forEach(s => allSymbols.add(s))
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
		if (isNonterminal(symbol)) {
			nonterminals.push(symbol)
		}
		else if (isTerminal(symbol)) {
			terminals.push(symbol)
		}
		else {
			throw new Error(`Неизвестный тип символа: ${symbol}`)
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

function isNonterminal(symbol: string): boolean {
	return symbol.length === 1 && symbol >= 'A' && symbol <= 'Z'
}

function isTerminal(symbol: string): boolean {
	return symbol.length === 1 && ((symbol >= 'a' && symbol <= 'z') || (symbol >= '0' && symbol <= '9'))
}

export {
	parseGrammar,
}
