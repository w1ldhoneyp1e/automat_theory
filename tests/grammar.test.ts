import {parseGrammar} from '../src/grammarParser'
import {dfaToDot, grammarToDFA} from '../src/grammarToDfa'

describe('Grammar Parser', () => {
	test('должен парсить простую грамматику', () => {
		const grammarText = `
            S -> aA | b
            A -> aA | b
            `

		const grammar = parseGrammar(grammarText)

		expect(grammar.nonterminals).toEqual(['S', 'A'])
		expect(grammar.terminals).toEqual(['a', 'b'])
		expect(grammar.startSymbol).toBe('S')
		expect(grammar.rules).toHaveLength(4)

		const sRules = grammar.rules.filter(r => r.left === 'S')
		expect(sRules).toHaveLength(2)
		expect(sRules.some(r => r.right.join('') === 'aA')).toBe(true)
		expect(sRules.some(r => r.right.join('') === 'b')).toBe(true)
	})

	test('должен парсить грамматику с пустыми правилами', () => {
		const grammarText = `
            S -> aS | e
            `

		const grammar = parseGrammar(grammarText)

		expect(grammar.rules).toHaveLength(2)
		const epsilonRule = grammar.rules.find(r => r.right.length === 0)
		expect(epsilonRule).toBeDefined()
		expect(epsilonRule!.left).toBe('S')
	})

	test('должен парсить грамматику с цифрами', () => {
		const grammarText = `
            S -> aA | 1B
            A -> aA | 2
            B -> 1B | b
            `

		const grammar = parseGrammar(grammarText)

		expect(grammar.nonterminals).toEqual(['S', 'A', 'B'])
		expect(grammar.terminals).toEqual(['a', '1', '2', 'b'])
		expect(grammar.startSymbol).toBe('S')
	})

	test('допускает любые символы как терминалы', () => {
		const grammarText = `
            S -> aA | @B
            A -> a
            B -> @
            `
		const grammar = parseGrammar(grammarText)
		expect(grammar.terminals).toContain('@')
		expect(grammar.rules).toHaveLength(4)
	})

	test('парсит угловые скобки: нетерминалы и терминалы', () => {
		const grammarText = `
            <idList> -> id <idList> | i
            `
		const grammar = parseGrammar(grammarText)
		expect(grammar.nonterminals).toContain('idList')
		expect(grammar.terminals).toEqual(expect.arrayContaining(['i', 'd']))
		expect(grammar.startSymbol).toBe('idList')
	})

})

describe('Grammar to DFA Conversion', () => {
	test('должен конвертировать простую грамматику в ДКА', () => {
		const grammarText = `
            S -> aS | b
            `

		const grammar = parseGrammar(grammarText)
		const dfa = grammarToDFA(grammar)

		expect(dfa.states.length).toBeGreaterThan(0)
		expect(dfa.transitions.length).toBeGreaterThan(0)

		const terminals = grammar.terminals
		for (const terminal of terminals) {
			const transitions = dfa.transitions.filter(t => t.input === terminal)
			expect(transitions.length).toBeGreaterThan(0)
		}
	})

	test('должен конвертировать грамматику с несколькими нетерминалами', () => {
		const grammarText = `
            S -> aA | bB
            A -> aA | c
            B -> bB | c
            `

		const grammar = parseGrammar(grammarText)
		const dfa = grammarToDFA(grammar)

		expect(dfa.states.length).toBeGreaterThan(1)
		expect(dfa.transitions.length).toBeGreaterThan(0)

		const startTransitions = dfa.transitions.filter(t => t.from === 'q0')
		expect(startTransitions.length).toBeGreaterThan(0)
	})

	test('должен выбрасывать ошибку для нерегулярной грамматики', () => {
		const grammarText = `
            S -> aAb
            A -> aA | b
            `

		const grammar = parseGrammar(grammarText)

		expect(() => grammarToDFA(grammar)).toThrow('не является регулярным')
	})

	test('должен генерировать корректный DOT для ДКА', () => {
		const grammarText = `
            S -> aS | b
            `

		const grammar = parseGrammar(grammarText)
		const dfa = grammarToDFA(grammar)
		const dot = dfaToDot(dfa)

		expect(dot).toContain('digraph')
		expect(dot).toContain('start -> q0')

		for (const state of dfa.states) {
			expect(dot).toContain(state)
		}

		for (const transition of dfa.transitions) {
			expect(dot).toContain(`${transition.from} -> ${transition.to}`)
			expect(dot).toContain(`label="${transition.input}"`)
		}
	})

	test('должен обрабатывать грамматику с пустыми правилами', () => {
		const grammarText = `
            S -> aS | e
            `

		const grammar = parseGrammar(grammarText)
		const dfa = grammarToDFA(grammar)

		expect(dfa.states.length).toBeGreaterThan(0)
		expect(dfa.transitions.length).toBeGreaterThan(0)
	})
})
