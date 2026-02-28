import {minimizeMealy} from '../src/automata/minimizer/mealy'
import {minimizeMoore} from '../src/automata/minimizer/moore'
import {type MealyMachine, type MooreMachine} from '../src/types'

describe('minimize', () => {
	describe('moore', () => {
		it('equivalent classes', () => {
			const machine: MooreMachine = {
				states: [
					{
						name: 'S1',
						output: 'w1',
					},
					{
						name: 'S2',
						output: 'w1',
					},
					{
						name: 'S3',
						output: 'w2',
					},
					{
						name: 'S4',
						output: 'w2',
					},
				],
				transitions: [
					{
						from: 'S1',
						to: 'S3',
						input: '0',
					},
					{
						from: 'S1',
						to: 'S4',
						input: '1',
					},
					{
						from: 'S2',
						to: 'S3',
						input: '0',
					},
					{
						from: 'S2',
						to: 'S4',
						input: '1',
					},
					{
						from: 'S3',
						to: 'S1',
						input: '0',
					},
					{
						from: 'S3',
						to: 'S2',
						input: '1',
					},
					{
						from: 'S4',
						to: 'S1',
						input: '0',
					},
					{
						from: 'S4',
						to: 'S2',
						input: '1',
					},
				],
			}

			const result = minimizeMoore(machine)

			expect(result.states).toEqual([
				{
					name: 'S1',
					output: 'w1',
				},
				{
					name: 'S3',
					output: 'w2',
				},
			])
			expect(result.transitions).toEqual([
				{
					from: 'S1',
					to: 'S3',
					input: '0',
				},
				{
					from: 'S1',
					to: 'S3',
					input: '1',
				},
				{
					from: 'S3',
					to: 'S1',
					input: '0',
				},
				{
					from: 'S3',
					to: 'S1',
					input: '1',
				},
			])
		})

		it('no equivalent classes', () => {
			const machine: MooreMachine = {
				states: [
					{
						name: 'S1',
						output: 'w1',
					},
					{
						name: 'S2',
						output: 'w2',
					},
					{
						name: 'S3',
						output: 'w3',
					},
				],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: '0',
					},
					{
						from: 'S2',
						to: 'S3',
						input: '0',
					},
					{
						from: 'S3',
						to: 'S1',
						input: '0',
					},
				],
			}

			const result = minimizeMoore(machine)

			expect(result.states).toEqual([
				{
					name: 'S1',
					output: 'w1',
				},
				{
					name: 'S2',
					output: 'w2',
				},
				{
					name: 'S3',
					output: 'w3',
				},
			])
			expect(result.transitions).toEqual([
				{
					from: 'S1',
					to: 'S2',
					input: '0',
				},
				{
					from: 'S2',
					to: 'S3',
					input: '0',
				},
				{
					from: 'S3',
					to: 'S1',
					input: '0',
				},
			])
		})

		it('one state', () => {
			const machine: MooreMachine = {
				states: [
					{
						name: 'S1',
						output: 'w1',
					},
				],
				transitions: [
					{
						from: 'S1',
						to: 'S1',
						input: '0',
					},
				],
			}

			const result = minimizeMoore(machine)

			expect(result.states).toEqual([
				{
					name: 'S1',
					output: 'w1',
				},
			])
			expect(result.transitions).toEqual([
				{
					from: 'S1',
					to: 'S1',
					input: '0',
				},
			])
		})
	})

	describe('mealy', () => {
		it('equivalent classes', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2', 'S3', 'S4', 'S5'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: '0',
						output: 'w1',
					},
					{
						from: 'S1',
						to: 'S3',
						input: '1',
						output: 'w2',
					},
					{
						from: 'S2',
						to: 'S4',
						input: '0',
						output: 'w1',
					},
					{
						from: 'S2',
						to: 'S5',
						input: '1',
						output: 'w2',
					},
					{
						from: 'S3',
						to: 'S4',
						input: '0',
						output: 'w1',
					},
					{
						from: 'S3',
						to: 'S5',
						input: '1',
						output: 'w2',
					},
					{
						from: 'S4',
						to: 'S4',
						input: '0',
						output: 'w1',
					},
					{
						from: 'S4',
						to: 'S5',
						input: '1',
						output: 'w2',
					},
					{
						from: 'S5',
						to: 'S4',
						input: '0',
						output: 'w1',
					},
					{
						from: 'S5',
						to: 'S5',
						input: '1',
						output: 'w2',
					},
				],
			}

			const result = minimizeMealy(machine)

			expect(result.states).toEqual(['S1'])
			expect(result.transitions).toEqual([
				{
					from: 'S1',
					to: 'S1',
					input: '0',
					output: 'w1',
				},
				{
					from: 'S1',
					to: 'S1',
					input: '1',
					output: 'w2',
				},
			])
		})

		it('no equivalent classes', () => {
			const machine: MealyMachine = {
				states: ['S1', 'S2', 'S3'],
				transitions: [
					{
						from: 'S1',
						to: 'S2',
						input: '0',
						output: 'w1',
					},
					{
						from: 'S2',
						to: 'S3',
						input: '0',
						output: 'w2',
					},
					{
						from: 'S3',
						to: 'S1',
						input: '0',
						output: 'w3',
					},
				],
			}

			const result = minimizeMealy(machine)

			expect(result.states).toEqual(['S1', 'S2', 'S3'])
			expect(result.transitions).toEqual([
				{
					from: 'S1',
					to: 'S2',
					input: '0',
					output: 'w1',
				},
				{
					from: 'S2',
					to: 'S3',
					input: '0',
					output: 'w2',
				},
				{
					from: 'S3',
					to: 'S1',
					input: '0',
					output: 'w3',
				},
			])
		})

		it('one state', () => {
			const machine: MealyMachine = {
				states: ['S1'],
				transitions: [
					{
						from: 'S1',
						to: 'S1',
						input: '0',
						output: 'w1',
					},
				],
			}

			const result = minimizeMealy(machine)

			expect(result.states).toEqual(['S1'])
			expect(result.transitions).toEqual([
				{
					from: 'S1',
					to: 'S1',
					input: '0',
					output: 'w1',
				},
			])
		})
	})
})

