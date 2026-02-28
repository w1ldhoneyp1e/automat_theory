import * as fs from 'fs'
import * as path from 'path'
import {detectMachineType, parse} from './parser'
import {
	processAsIs,
	processConversion,
	processDeterminization,
	processGrammarCYK,
	processGrammarNormalize,
	processGrammarToDFA,
	processMinimization,
	processRegexToNFA,
} from './processor'

function generateOutputFileName(inputFile: string, forceDot: boolean = false): string {
	const ext = path.extname(inputFile)
	const baseName = path.basename(inputFile, ext)
	const dir = path.dirname(inputFile)
	if (forceDot) {
		return path.join(dir, `${baseName}.dot`)
	}
	return path.join(dir, `${baseName}_converted${ext}`)
}

async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const inputFile = args[0]
	const shouldConvert = args.includes('-c')
	const shouldMinimize = args.includes('--minimize') || args.includes('-m')
	const shouldDeterminize = args.includes('--determinize') || args.includes('-d')
	const shouldGrammarToDFA = args.includes('--grammar-to-dfa') || args.includes('-g')
	const shouldNormalizeGrammar = args.includes('--normalize-grammar') || args.includes('-n')
	const shouldRegexToNFA = args.includes('--regex-to-nfa') || args.includes('-r')
	const cykIdx = args.findIndex(a => a === '--cyk' || a.startsWith('--cyk='))
	const shouldCYK = cykIdx >= 0
	const cykWord = shouldCYK
		? (args[cykIdx].startsWith('--cyk=')
			? args[cykIdx].slice(6)
			: args[cykIdx + 1])
		: ''
	const outputFile = args.find(arg => !arg.startsWith('-') && arg !== inputFile && arg !== cykWord)
		|| generateOutputFileName(inputFile, shouldRegexToNFA)

	try {
		const inputContent = fs.readFileSync(inputFile, 'utf-8')

		let outputContent: string

		if (shouldRegexToNFA) {
			outputContent = processRegexToNFA(inputContent, shouldMinimize)
		}
		else if (shouldCYK) {
			if (cykWord === undefined || (typeof cykWord === 'string' && cykWord.startsWith('-') && cykWord.length > 1)) {
				throw new Error('Укажите строку для проверки: --cyk <строка> или --cyk=<строка>')
			}
			outputContent = processGrammarCYK(inputContent, cykWord ?? '')
		}
		else if (shouldNormalizeGrammar) {
			outputContent = processGrammarNormalize(inputContent)
		}
		else if (shouldGrammarToDFA) {
			outputContent = processGrammarToDFA(inputContent)
		}
		else {
			const dotGraph = parse(inputContent)
			const machineType = detectMachineType(dotGraph)

			if (shouldDeterminize && shouldMinimize) {
				const determinizedContent = processDeterminization(dotGraph, machineType)
				const determinizedDotGraph = parse(determinizedContent)
				const determinizedMachineType = detectMachineType(determinizedDotGraph)
				outputContent = processMinimization(determinizedDotGraph, determinizedMachineType)
			}
			else if (shouldConvert && shouldMinimize) {
				const convertedContent = processConversion(dotGraph, machineType)
				const convertedDotGraph = parse(convertedContent)
				const convertedMachineType = detectMachineType(convertedDotGraph)
				outputContent = processMinimization(convertedDotGraph, convertedMachineType)
			}
			else if (shouldConvert && shouldDeterminize) {
				const determinizedContent = processDeterminization(dotGraph, machineType)
				const determinizedDotGraph = parse(determinizedContent)
				const determinizedMachineType = detectMachineType(determinizedDotGraph)
				outputContent = processConversion(determinizedDotGraph, determinizedMachineType)
			}
			else if (shouldDeterminize) {
				outputContent = processDeterminization(dotGraph, machineType)
			}
			else if (shouldConvert) {
				outputContent = processConversion(dotGraph, machineType)
			}
			else if (shouldMinimize) {
				outputContent = processMinimization(dotGraph, machineType)
			}
			else {
				outputContent = processAsIs(inputContent)
			}
		}

		fs.writeFileSync(outputFile, outputContent, 'utf-8')
		console.log('Результат:')
		console.log(outputContent)

	}
	catch (error) {
		console.error('Ошибка:', error instanceof Error
			? error.message
			: error)
		process.exit(1)
	}
}

if (require.main === module) {
	main().catch(console.error)
}
