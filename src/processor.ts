import {mealyToMoore, mooreToMealy} from './converter'
import {
	determinizeMealy,
	determinizeNFA,
	dfaToDot,
	isMealyDeterministic,
} from './determinizer'
import {minimizeDFA} from './dfaMinimizer'
import {generateMealyDot, generateMooreDot} from './generator'
import {toChomskyNormalForm} from './chomskyNormalForm'
import {cyk} from './cyk'
import {parseGrammar} from './grammarParser'
import {dfaToDot as grammarDfaToDot, grammarToDFA} from './grammarToDfa'
import {minimizeMealy} from './minimizer/mealy'
import {minimizeMoore} from './minimizer/moore'
import {nfaToDot, regexToNFA} from './regexToNfa'
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

function processMealyDeterminization(dotGraph: DotGraph): string {
	const mealyMachine = parseMealyFromDot(dotGraph)
	const determinizedMachine = determinizeMealy(mealyMachine)

	if (isMealyDeterministic(mealyMachine)) {
		console.log('Автомат уже является детерминированным')
	}

	return generateMealyDot(determinizedMachine)
}

function processDeterminization(dotGraph: DotGraph, machineType: 'mealy' | 'moore'): string {
	if (machineType === 'mealy') {
		return processMealyDeterminization(dotGraph)
	}

	const mealyMachine = mooreToMealy(dotGraph)

	if (isMealyDeterministic(mealyMachine)) {
		console.log('Автомат уже является детерминированным')
		return generateMealyDot(mealyMachine)
	}

	const determinizedMealy = determinizeMealy(mealyMachine)
	return generateMealyDot(determinizedMealy)
}

function processGrammarToDFA(grammarText: string): string {
	const grammar = parseGrammar(grammarText)
	const dfa = grammarToDFA(grammar)
	return grammarDfaToDot(dfa)
}

function processRegexToNFA(regexText: string, shouldMinimize: boolean = false): string {
	const regex = regexText.trim()
	const nfa = regexToNFA(regex)

	if (shouldMinimize) {
		const dfa = determinizeNFA(nfa)
		const minimizedDfa = minimizeDFA(dfa)
		return dfaToDot(minimizedDfa)
	}

	return nfaToDot(nfa)
}

function formatCykTable(w: string, table: string[][][]): string {
	const lines: string[] = []
	for (let i = 0; i < table.length; i++) {
		for (let len = 1; len <= table[i].length; len++) {
			const sub = w.substring(i, i + len)
			const nts = table[i][len - 1]
			if (nts.length > 0) {
				lines.push(`  [${i},${i + len}) "${sub}" -> ${nts.join(', ')}`)
			}
		}
	}
	return lines.join('\n')
}

function processGrammarCYK(grammarText: string, word: string): string {
	const grammar = parseGrammar(grammarText)
	const cnf = toChomskyNormalForm(grammar)
	const result = cyk(cnf, word)
	const belongsStr = result.belongs ? 'да' : 'нет'
	const tableStr = result.table.length > 0
		? `Таблица CYK:\n${formatCykTable(word, result.table)}`
		: ''
	return `Грамматика (КНФ): ${cnf.rules.length} правил\nСтрока: "${word}"\nПринадлежность: ${belongsStr}\n${tableStr}`
}

export {
	processAsIs,
	processConversion,
	processDeterminization,
	processGrammarToDFA,
	processGrammarCYK,
	processMinimization,
	processRegexToNFA,
}
