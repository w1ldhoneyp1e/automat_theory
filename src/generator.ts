import {type MealyMachine, type MooreMachine} from './types'

function generateMealyDot(machine: MealyMachine): string {
	let dot = 'digraph MealyMachine {\n'

	machine.states.forEach(state => {
		dot += `  ${state} [label="${state}"];\n`
	})

	dot += '\n'

	machine.transitions.forEach(transition => {
		dot += `  ${transition.from} -> ${transition.to} [label="${transition.input}/${transition.output}"];\n`
	})

	dot += '}'
	return dot
}

function generateMooreDot(machine: MooreMachine): string {
	let dot = 'digraph MooreMachine {\n'

	machine.states.forEach(state => {
		dot += `  ${state.name} [label="${state.name} / ${state.output}"];\n`
	})

	dot += '\n'

	machine.transitions.forEach(transition => {
		dot += `  ${transition.from} -> ${transition.to} [label="${transition.input}"];\n`
	})

	dot += '}'
	return dot
}

export {generateMealyDot, generateMooreDot}
