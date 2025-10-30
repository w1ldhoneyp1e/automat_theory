import * as fs from 'fs'
import * as path from 'path'
import {detectMachineType, parse} from './parser'
import {
	processAsIs,
	processConversion,
	processDeterminization,
	processGrammarToDFA,
	processMinimization,
} from './processor'

function generateOutputFileName(inputFile: string): string {
	const ext = path.extname(inputFile)
	const baseName = path.basename(inputFile, ext)
	const dir = path.dirname(inputFile)
	return path.join(dir, `${baseName}_converted${ext}`)
}

async function main(): Promise<void> {
	const args = process.argv.slice(2)
	const inputFile = args[0]
	const shouldConvert = args.includes('-c')
	const shouldMinimize = args.includes('--minimize') || args.includes('-m')
	const shouldDeterminize = args.includes('--determinize') || args.includes('-d')
	const shouldGrammarToDFA = args.includes('--grammar-to-dfa') || args.includes('-g')
	const outputFile = args.find(arg => !arg.startsWith('-') && arg !== inputFile) || generateOutputFileName(inputFile)

	try {
		const inputContent = fs.readFileSync(inputFile, 'utf-8')

		let outputContent: string

		if (shouldGrammarToDFA) {
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
