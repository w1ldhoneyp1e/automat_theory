import {parseRegex} from '../src/regex/parser'
import {nfaToDot, regexToNFA} from '../src/regex/to-nfa'

describe('Regex Parser', () => {
	it('должен парсить простые символы', () => {
		const result = parseRegex('a')
		expect(result).toEqual({
			type: 'char',
			value: 'a',
		})
	})

	it('должен парсить конкатенацию', () => {
		const result = parseRegex('ab')
		expect(result).toEqual({
			type: 'concat',
			children: [
				{
					type: 'char',
					value: 'a',
				},
				{
					type: 'char',
					value: 'b',
				},
			],
		})
	})

	it('должен парсить объединение через |', () => {
		const result = parseRegex('a|b')
		expect(result).toEqual({
			type: 'union',
			children: [
				{
					type: 'char',
					value: 'a',
				},
				{
					type: 'char',
					value: 'b',
				},
			],
		})
	})

	it('должен парсить объединение через +', () => {
		const result = parseRegex('a+b')
		expect(result).toEqual({
			type: 'union',
			children: [
				{
					type: 'char',
					value: 'a',
				},
				{
					type: 'char',
					value: 'b',
				},
			],
		})
	})

	it('должен парсить итерацию *', () => {
		const result = parseRegex('a*')
		expect(result).toEqual({
			type: 'star',
			children: [
				{
					type: 'char',
					value: 'a',
				},
			],
		})
	})

	it('должен парсить скобки', () => {
		const result = parseRegex('(a|b)')
		expect(result).toEqual({
			type: 'union',
			children: [
				{
					type: 'char',
					value: 'a',
				},
				{
					type: 'char',
					value: 'b',
				},
			],
		})
	})

	it('должен парсить сложное выражение', () => {
		const result = parseRegex('aa*|(abc|b*c)')
		expect(result.type).toBe('union')
		if (result.type === 'union') {
			expect(result.children).toHaveLength(2)
		}
	})

	it('должен парсить формат с =', () => {
		const result = parseRegex('S=aa*|(abc|b*c)')
		expect(result.type).toBe('union')
	})

	it('должен создавать NFA из регулярного выражения', () => {
		const nfa = regexToNFA('a|b')
		expect(nfa.states.size).toBeGreaterThan(0)
		expect(nfa.startState).toBeDefined()
		expect(nfa.acceptStates.size).toBeGreaterThan(0)
		expect(nfa.transitions.length).toBeGreaterThan(0)
	})

	it('должен генерировать DOT из NFA', () => {
		const nfa = regexToNFA('a|b')
		const dot = nfaToDot(nfa)
		expect(dot).toContain('digraph NFA')
		expect(dot).toContain(nfa.startState)
	})
})

