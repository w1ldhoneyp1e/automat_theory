import {cyk} from '../src/grammar/cyk'
import {eliminateEpsilonRules} from '../src/grammar/epsilon'
import {toChomskyNormalForm} from '../src/grammar/normalization'
import {parseGrammar} from '../src/grammar/parser'

describe('Устранение пустых правил', () => {
	test('убирает ε-правила и добавляет варианты', () => {
		const g = parseGrammar(`
			S -> A B
			A -> a | e
			B -> b | e
		`)
		const out = eliminateEpsilonRules(g)
		const epsilonRules = out.rules.filter(r => r.right.length === 0)
		expect(epsilonRules.length).toBeLessThanOrEqual(1)
		expect(out.rules.some(r => r.left === 'S' && r.right.join('') === 'AB')).toBe(true)
		expect(out.rules.some(r => r.left === 'S' && r.right.join('') === 'A')).toBe(true)
		expect(out.rules.some(r => r.left === 'S' && r.right.join('') === 'B')).toBe(true)
	})

	test('если старт nullable, добавляется S\' с ε', () => {
		const g = parseGrammar(`
			S -> A | e
			A -> a
		`)
		const out = eliminateEpsilonRules(g)
		expect(out.startSymbol).toBe('S\'')
		const eps = out.rules.filter(r => r.right.length === 0)
		expect(eps.length).toBe(1)
		expect(eps[0].left).toBe('S\'')
	})
})

describe('Нормальная форма Хомского', () => {
	test('все правила КНФ: A->BC или A->a', () => {
		const g = parseGrammar(`
			S -> A B
			A -> a
			B -> b
		`)
		const cnf = toChomskyNormalForm(g)
		for (const r of cnf.rules) {
			expect(r.right.length).toBeGreaterThan(0)
			if (r.right.length === 1) {
				expect(cnf.terminals).toContain(r.right[0])
			}
			else {
				expect(r.right.length).toBe(2)
				expect(cnf.nonterminals).toContain(r.right[0])
				expect(cnf.nonterminals).toContain(r.right[1])
			}
		}
	})

	test('длинные правые части разбиваются в цепочку пар', () => {
		const g = parseGrammar(`
			S -> A B C
			A -> a
			B -> b
			C -> c
		`)
		const cnf = toChomskyNormalForm(g)
		const sRules = cnf.rules.filter(r => r.left === 'S')
		expect(sRules.length).toBe(1)
		expect(sRules[0].right.length).toBe(2)
		expect(cnf.nonterminals.length).toBeGreaterThan(4)
	})
})

describe('CYK', () => {
	test('возвращает belongs и table', () => {
		const g = parseGrammar(`
			S -> A B
			A -> a
			B -> b
		`)
		const cnf = toChomskyNormalForm(g)
		const res = cyk(cnf, 'ab')
		expect(res).toHaveProperty('belongs')
		expect(res).toHaveProperty('table')
		expect(Array.isArray(res.table)).toBe(true)
		expect(res.belongs).toBe(true)
		expect(res.table[0][1]).toContain('S')
	})

	test('отвергает строку не из языка', () => {
		const g = parseGrammar(`
			S -> A B
			A -> a
			B -> b
		`)
		const cnf = toChomskyNormalForm(g)
		expect(cyk(cnf, 'ba').belongs).toBe(false)
		expect(cyk(cnf, 'a').belongs).toBe(false)
		expect(cyk(cnf, 'abc').belongs).toBe(false)
	})

	test('пустая строка: принадлежит только если есть S->ε', () => {
		const g = parseGrammar(`
			S -> A B | e
			A -> a
			B -> b
		`)
		const afterEpsilon = eliminateEpsilonRules(g)
		const cnf = toChomskyNormalForm(afterEpsilon)
		const resEmpty = cyk(cnf, '')
		expect(resEmpty.table).toEqual([])
	})
})
