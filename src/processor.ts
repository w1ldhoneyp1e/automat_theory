import {mealyToMoore, mooreToMealy} from './converter'
import {generateMealyDot, generateMooreDot} from './generator'
import {minimizeMealy} from './minimizer/mealy'
import {minimizeMoore} from './minimizer/moore'
import {
	type DotGraph,
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

export {
	processAsIs,
	processConversion,
	processMinimization,
}
