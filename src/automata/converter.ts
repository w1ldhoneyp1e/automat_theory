import {
	type DotGraph,
	type MealyMachine,
	type MealyTransition,
	type MooreMachine,
	type MooreState,
	type MooreTransition,
} from '../types'

function parseMealyFromDot(dotGraph: DotGraph): MealyMachine {
	const states = dotGraph.nodes.map(node => node.id)
	const transitions: MealyTransition[] = []

	dotGraph.edges.forEach(edge => {
		if (edge.label && edge.label.includes('/')) {
			const [input, output] = edge.label.split('/')
			transitions.push({
				from: edge.from,
				to: edge.to,
				input: input.trim(),
				output: output.trim(),
			})
		}
	})

	return {
		states,
		transitions,
	}
}

function parseMooreFromDot(dotGraph: DotGraph): MooreMachine {
	const states: MooreState[] = []
	const transitions: MooreTransition[] = []

	dotGraph.nodes.forEach(node => {
		if (node.label && node.label.includes('/')) {
			const [stateName, output] = node.label.split('/')
			states.push({
				name: stateName.trim(),
				output: output.trim(),
			})
		}
		else {
			states.push({
				name: node.id,
				output: '',
			})
		}
	})

	dotGraph.edges.forEach(edge => {
		transitions.push({
			from: edge.from,
			to: edge.to,
			input: edge.label || '',
		})
	})

	return {
		states,
		transitions,
	}
}

function mealyToMoore(dotGraph: DotGraph): MooreMachine {
	const mealyMachine = parseMealyFromDot(dotGraph)

	const allStates = new Set<string>()
	mealyMachine.transitions.forEach(transition => {
		allStates.add(`${transition.from}_${transition.output}`)
		allStates.add(`${transition.to}_${transition.output}`)
	})

	const mooreStates: MooreState[] = []
	allStates.forEach(stateName => {
		const [, output] = stateName.split('_')
		mooreStates.push({
			name: stateName,
			output,
		})
	})

	const mooreTransitions: MooreTransition[] = []
	mealyMachine.transitions.forEach(transition => {
		const fromState = `${transition.from}_${transition.output}`
		const toState = `${transition.to}_${transition.output}`

		mooreTransitions.push({
			from: fromState,
			to: toState,
			input: transition.input,
		})
	})

	return {
		states: mooreStates,
		transitions: mooreTransitions,
	}
}

function mooreToMealy(dotGraph: DotGraph): MealyMachine {
	const mooreMachine = parseMooreFromDot(dotGraph)

	const mealyStates = mooreMachine.states.map(state => state.name)

	const mealyTransitions: MealyTransition[] = []

	mooreMachine.transitions.forEach(transition => {
		const toState = mooreMachine.states.find(s => s.name === transition.to)
		if (toState) {
			mealyTransitions.push({
				from: transition.from,
				to: transition.to,
				input: transition.input,
				output: toState.output,
			})
		}
	})

	return {
		states: mealyStates,
		transitions: mealyTransitions,
	}
}

export {mealyToMoore, mooreToMealy}
