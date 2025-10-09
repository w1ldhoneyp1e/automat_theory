import {mealyToMoore, mooreToMealy} from './converter'
import {generateMealyDot, generateMooreDot} from './generator'
import {minimizeMealy} from './minimizer/mealy'
import {minimizeMoore} from './minimizer/moore'
import {type DotGraph} from './types'

function processAsIs(inputContent: string): string {
	return inputContent
}

function processMealyConversion(dotGraph: DotGraph, shouldMinimize: boolean): string {
	let mooreMachine = mealyToMoore(dotGraph)

	if (shouldMinimize) {
		mooreMachine = minimizeMoore(mooreMachine)
	}

	const outputContent = generateMooreDot(mooreMachine)
	return outputContent
}

function processMooreConversion(dotGraph: DotGraph, shouldMinimize: boolean): string {
	let mealyMachine = mooreToMealy(dotGraph)

	if (shouldMinimize) {
		mealyMachine = minimizeMealy(mealyMachine)
	}

	const outputContent = generateMealyDot(mealyMachine)
	return outputContent
}

function processConversion(dotGraph: DotGraph, machineType: 'mealy' | 'moore', shouldMinimize: boolean): string {
	if (machineType === 'mealy') {
		return processMealyConversion(dotGraph, shouldMinimize)
	}

	return processMooreConversion(dotGraph, shouldMinimize)

}

export {processAsIs, processConversion}
