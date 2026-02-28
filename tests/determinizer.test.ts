import {determinizeMealy, isMealyDeterministic} from '../src/automata/determinizer'
import {type MealyMachine} from '../src/types'

describe('Determinizer', () => {
	describe('isMealyDeterministic', () => {
		it('должен определять детерминированный автомат', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2', 'S3'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S2',
						to: 'S3',
						input: 'b',
						output: 'y2',
					},
					{
						from: 'S1',
						to: 'S3',
						input: 'b',
						output: 'y3',
					},
				],
			}

			expect(isMealyDeterministic(machine)).toBe(true)
		})

		it('должен определять недетерминированный автомат', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2', 'S3'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S1',
						to: 'S3',
						input: 'a',
						output: 'y2',
					},
				],
			}

			expect(isMealyDeterministic(machine)).toBe(false)
		})

		it('должен определять недетерминированный автомат с одинаковым выходом', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2', 'S3'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S1',
						to: 'S3',
						input: 'a',
						output: 'y1',
					},
				],
			}

			expect(isMealyDeterministic(machine)).toBe(false)
		})
	})

	describe('determinizeMealy', () => {
		it('должен возвращать тот же автомат, если он уже детерминированный', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
				],
			}

			const result = determinizeMealy(machine)

			expect(result).toEqual(machine)
		})

		it('должен детерминизировать автомат с одинаковым выходом', () => {
			const machine: MealyMachine = {
				states: ['S0', 'S1', 'S2'],
				transitions: [
					{
						from: 'S0',
						to: 'S1',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S0',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S1',
						to: 'S0',
						input: 'b',
						output: 'y2',
					},
					{
						from: 'S2',
						to: 'S0',
						input: 'b',
						output: 'y3',
					},
				],
			}

			const result = determinizeMealy(machine)

			expect(result.states).toContain('S0')
			expect(result.states).toContain('{S1,S2}')
			expect(isMealyDeterministic(result)).toBe(true)

			const transitionFromS0 = result.transitions.find(
				t => t.from === 'S0' && t.input === 'a',
			)
			expect(transitionFromS0).toBeDefined()
			expect(transitionFromS0?.to).toBe('{S1,S2}')
			expect(transitionFromS0?.output).toBe('y1')
		})

		it('должен детерминизировать автомат с разными выходами', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2', 'S3', 'S4'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S1',
						to: 'S3',
						input: 'a',
						output: 'y2',
					},
					{
						from: 'S2',
						to: 'S4',
						input: 'b',
						output: 'y3',
					},
					{
						from: 'S3',
						to: 'S4',
						input: 'b',
						output: 'y4',
					},
					{
						from: 'S4',
						to: 'S1',
						input: 'c',
						output: 'y5',
					},
				],
			}

			const result = determinizeMealy(machine)

			expect(isMealyDeterministic(result)).toBe(true)

			expect(result.states).toContain('{S2,S3}')

			const transitionFromS1 = result.transitions.find(
				t => t.from === 'S1' && t.input === 'a',
			)
			expect(transitionFromS1).toBeDefined()
			expect(transitionFromS1?.to).toBe('{S2,S3}')
			expect(transitionFromS1?.output).toBe('y1')
		})

		it('должен правильно обрабатывать циклические автоматы', () => {
			const machine: MealyMachine = {
				states: ['S0', 'S1', 'S2'],
				transitions: [
					{
						from: 'S0',
						to: 'S1',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S0',
						to: 'S2',
						input: 'a',
						output: 'y1',
					},
					{
						from: 'S1',
						to: 'S0',
						input: 'b',
						output: 'y2',
					},
					{
						from: 'S2',
						to: 'S0',
						input: 'b',
						output: 'y3',
					},
				],
			}

			const result = determinizeMealy(machine)

			expect(isMealyDeterministic(result)).toBe(true)
			expect(result.states.length).toBeGreaterThan(0)

			const hasReturnToS0 = result.transitions.some(
				t => t.to === 'S0',
			)
			expect(hasReturnToS0).toBe(true)
		})
	})
})

